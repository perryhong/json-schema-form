const Ajv = require('ajv')

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 10
    },
    age: {
      type: 'number'
    }
  }
}


const ajv = new Ajv()
const validate = ajv.compile(schema)
const valid = validate('hhhh')

if (!valid) console.log(validate.errors)
