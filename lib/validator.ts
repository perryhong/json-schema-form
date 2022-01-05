import Ajv, { ErrorObject } from 'ajv'
import { Schema } from './types'
import { isObject } from './utils'
const i18n = require('ajv-i18n')

interface TransformedErrorObject {
  name: string
  property: string
  message: string | undefined
  params: any
  schemaPath: string
}

interface ErrorSchemaObject {
  [level: string]: ErrorSchema
}

export type ErrorSchema = ErrorSchemaObject & {
  __errors?: string[]
}

function toErrorSchema(errors: TransformedErrorObject[]) {
  if (errors.length < 1) return {}
  return errors.reduce((errorSchema, error) => {
    const { property = '', message } = error
    const path = property.split('/')
    let parent = errorSchema
    if (path.length > 0 && path[0] === '') {
      path.splice(0, 1)
    }
    for (const segment of path.slice(0)) {
      if (!(segment in parent)) {
        ;(parent as any)[segment] = {}
      }
      parent = (parent as any)[segment]
    }

    if (Array.isArray(parent.__errors)) {
      parent.__errors = parent.__errors.concat(message || '')
    } else {
      if (message) {
        parent.__errors = [message]
      }
    }

    return errorSchema
  }, {} as ErrorSchema)
}

function transformErrors(
  errors: ErrorObject[] | null | undefined,
): TransformedErrorObject[] {
  if (errors === null || errors === undefined) return []
  return errors.map(
    ({ keyword, instancePath, schemaPath, params, message }) => {
      return {
        name: keyword,
        property: `${instancePath}`,
        schemaPath,
        params,
        message,
      }
    },
  )
}
export async function validateFromData(
  validator: Ajv,
  formData: any,
  schema: Schema,
  locale = 'zh',
  customValidate?: (data: any, errors: any) => void,
) {
  let validatorError = null
  try {
    validator.validate(schema, formData)
  } catch (err) {
    validatorError = err
  }
  i18n[locale](validator.errors)
  let errors = transformErrors(validator.errors)
  if (validatorError) {
    errors = [
      ...errors,
      {
        message: (validatorError as any).message,
      } as TransformedErrorObject,
    ]
  }

  const errorSchema = toErrorSchema(errors)

  if (!customValidate) {
    return {
      errors,
      errorSchema,
      valid: errors.length === 0,
    }
  }
  const proxy = createErrorProxy()
  await customValidate(formData, proxy)
  const newErrorSchema = mergeObjects(errorSchema, proxy, true)
  const newErrors = toErrorList(newErrorSchema)
  return {
    errors: newErrors,
    errorSchema: newErrorSchema,
    valid: newErrors.length === 0,
  }
}

function createErrorProxy() {
  const raw = {}
  return new Proxy(raw, {
    get(target, key, reciver) {
      if (key === 'addError') {
        return (msg: string) => {
          const __errors = Reflect.get(target, '__errors', reciver)
          if (__errors && Array.isArray(__errors)) {
            __errors.push(msg)
          } else {
            ;(target as any).__errors = [msg]
          }
        }
      }
      const res = Reflect.get(target, key, reciver)
      if (res === undefined) {
        const p: any = createErrorProxy()
        ;(target as any)[key] = p
        return p
      }
      return res
    },
  })
}

export function mergeObjects(obj1: any, obj2: any, concatArrays = false) {
  // Recursively merge deeply nested objects
  console.log(Object.keys(obj2))
  const accumulator = Object.assign({}, obj1) // Prevent mutation of source object
  return Object.keys(obj2).reduce((accumulator, key) => {
    const left = obj1 ? obj1[key] : {}
    const right = obj2[key]
    if (obj1 && obj1.hasOwnProperty(key) && isObject(right)) {
      accumulator[key] = mergeObjects(left, right, concatArrays) // 递归
    } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
      accumulator[key] = left.concat(right)
    } else {
      accumulator[key] = right
    }
    return accumulator
  }, accumulator)
}

export function toErrorList(errorSchema: ErrorSchema, fieldName = 'root') {
  let errorList: TransformedErrorObject[] = []
  if ('__errors' in errorSchema) {
    errorList = errorList.concat(
      (errorSchema.__errors || []).map((stack) => {
        return {
          message: `${fieldName}: ${stack}`,
        } as TransformedErrorObject
      }),
    )
  }
  return Object.keys(errorSchema).reduce((acc, key) => {
    if (key !== '__errors') {
      acc = acc.concat(toErrorList(errorSchema[key], key))
    }
    return acc
  }, errorList)
}
