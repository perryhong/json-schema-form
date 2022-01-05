import { defineComponent } from 'vue'
import { withFormItem } from './FormItem'

import { CommonWidgetPropsDefine } from '../types'

const NumberWidget = withFormItem(
  defineComponent({
    props: CommonWidgetPropsDefine,
    setup(props) {
      const handleChange = (e: any) => {
        const value = e.target.value
        const num = Number(value)
        e.target.value = props.value
        if (Number.isNaN(num)) {
          props.onChange(undefined)
        } else {
          props.onChange(num)
        }
      }
      return () => {
        const { value } = props
        return <input type="number" value={value} onInput={handleChange} />
      }
    },
  }),
)

export default NumberWidget
