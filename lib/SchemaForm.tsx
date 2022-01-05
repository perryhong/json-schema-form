import {
  defineComponent,
  PropType,
  provide,
  Ref,
  ref,
  watch,
  shallowRef,
  watchEffect,
  computed,
} from 'vue'
import Ajv, { Options } from 'ajv'
import {
  CustomFormat,
  Schema,
  UISchema,
  CommonWidgetDefine,
  CustomKeyword,
} from './types'
import { SchemaFormContextKey } from './context'
import { ErrorSchema, validateFromData } from './validator'

import SchemaItem from './SchemaItem'

const defaultAjvOptions: Options = {
  allErrors: true,
  // jsonPointers: true,
}

interface ContextRef {
  doValidate: () => Promise<{
    errors: any[]
    valid: boolean
  }>
}

export default defineComponent({
  name: 'SchemaForm',
  props: {
    schema: {
      type: Object as PropType<Schema>,
      required: true,
    },
    value: {
      required: true,
    },
    onChange: {
      type: Function as PropType<(v: any) => void>,
      required: true,
    },
    contextRef: {
      type: Object as PropType<Ref<ContextRef>>,
    },
    ajvOptions: {
      type: Object as PropType<Options>,
    },
    locale: {
      type: String,
      default: 'zh',
    },
    customValidate: {
      type: Function as PropType<(data: any, errors: any) => void>,
    },
    uiSchema: {
      type: Object as PropType<UISchema>,
      required: true,
    },
    customFormats: {
      type: [Array, Object] as PropType<CustomFormat[] | CustomFormat>,
    },
    customKeywords: {
      type: [Array, Object] as PropType<CustomKeyword[] | CustomKeyword>,
    },
  },
  setup(props) {
    const errorSchemaRef: Ref<ErrorSchema> = shallowRef({})
    const validatorRef: Ref<Ajv> = shallowRef() as any

    const formatMapRef = computed(() => {
      if (props.customFormats) {
        const customFormats = Array.isArray(props.customFormats)
          ? props.customFormats
          : [props.customFormats]
        return customFormats.reduce((result, format) => {
          result[format.name] = format.component
          return result
        }, {} as { [key: string]: CommonWidgetDefine })
      }
      return {}
    })

    const transformSchemaRef = computed(() => {
      if (props.customKeywords) {
        const customKeywords = Array.isArray(props.customKeywords)
          ? props.customKeywords
          : [props.customKeywords]
        return (schema: Schema) => {
          let newSchema = schema
          customKeywords.forEach((keyword) => {
            if ((newSchema as any)[keyword.name]) {
              newSchema = keyword.transformSchema(schema)
            }
          })
          return newSchema
        }
      }
      return (s: Schema) => s
    })

    const context: any = {
      SchemaItem,
      formatMapRef,
      transformSchemaRef,
    }

    provide(SchemaFormContextKey, context)

    watchEffect(() => {
      validatorRef.value = new Ajv({
        ...defaultAjvOptions,
        ...props.ajvOptions,
      })

      if (props.customFormats) {
        const customFormats = Array.isArray(props.customFormats)
          ? props.customFormats
          : [props.customFormats]
        customFormats.forEach((format) => {
          validatorRef.value.addFormat(format.name, format.definition)
        })
      }

      if (props.customKeywords) {
        const customKeywords = Array.isArray(props.customKeywords)
          ? props.customKeywords
          : [props.customKeywords]
        customKeywords.forEach((keyword) => {
          validatorRef.value.addKeyword(keyword.definition)
        })
      }
    })
    const handleChange = (v: any) => {
      props.onChange(v)
    }

    const validateResolveRef = ref()
    const validateIndex = ref(0)

    watch(
      () => props.value,
      () => {
        if (validateResolveRef.value) {
          validate()
        }
      },
      { deep: true },
    )

    async function validate() {
      console.log('start validate')
      // const valid = validatorRef.value.validate(
      //   props.schema,
      //   props.value,
      // ) as boolean
      const index = (validateIndex.value += 1)
      const result = await validateFromData(
        validatorRef.value,
        props.value,
        props.schema,
        props.locale,
        props.customValidate,
      )
      if (index !== validateIndex.value) return
      console.log('end validate')
      errorSchemaRef.value = result.errorSchema
      validateResolveRef.value(result)
      validateResolveRef.value = undefined
    }

    watch(
      () => props.contextRef,
      () => {
        if (props.contextRef) {
          props.contextRef.value = {
            doValidate() {
              return new Promise((resolve) => {
                validateResolveRef.value = resolve
                validate()
              })
            },
          }
        }
      },
      {
        immediate: true,
      },
    )

    return () => {
      const { schema, value, uiSchema } = props
      return (
        <SchemaItem
          schema={schema}
          rootSchema={schema}
          value={value}
          onChange={handleChange}
          uiSchema={uiSchema || {}}
          errorSchema={errorSchemaRef.value || {}}
        />
      )
    }
  },
})
