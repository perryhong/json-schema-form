import { computed, defineComponent } from 'vue'
import { withFormItem } from './FormItem'
import { CommonWidgetPropsDefine } from '../types'

const TextWidget = withFormItem(
  defineComponent({
    name: 'TextWidget',
    props: CommonWidgetPropsDefine,
    setup(props) {
      const handleChange = (e: any) => {
        const v = e.target.value
        e.target.value = props.value
        props.onChange(v)
      }
      const styleRef = computed(() => {
        return {
          color: (props.options && props.options.color) || 'black',
        }
      })

      return () => {
        const { value } = props
        const style = styleRef.value
        return (
          <input
            type="text"
            value={value}
            onInput={handleChange}
            style={style}
          />
        )
      }
    },
  }),
)

export default TextWidget
