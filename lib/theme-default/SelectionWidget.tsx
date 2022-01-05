import { defineComponent, ref, watch } from 'vue'
import { SelectionWidgetPropsDefine } from '../types'
import { withFormItem } from './FormItem'

const SelectionWidget = withFormItem(
  defineComponent({
    name: 'SelectionWidget',
    props: SelectionWidgetPropsDefine,
    setup(props) {
      const currentValueRef = ref(props.value || [])
      watch(currentValueRef, (newVal, oldVal) => {
        if (newVal !== oldVal) {
          props.onChange(newVal)
        }
      })
      watch(
        () => props.value,
        (v) => {
          if (v !== currentValueRef.value) {
            currentValueRef.value = v
          }
        },
      )
      return () => {
        const { options } = props
        return (
          <select multiple={true} v-model={currentValueRef.value}>
            {options.map((opt) => (
              <option value={opt.value}>{opt.key}</option>
            ))}
          </select>
        )
      }
    },
  }),
)

export default SelectionWidget
