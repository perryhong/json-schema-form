import { FieldPropsDefine, CommonWidgetNames } from '../types'
import { computed, defineComponent } from 'vue'
import { getWidget } from '../theme'

export default defineComponent({
  props: FieldPropsDefine,
  setup(props) {
    const TextWidgetRef = computed(() => {
      const widgetRef = getWidget(CommonWidgetNames.TextWidget, props)
      return widgetRef.value
    })

    const widgetOptionsRef = computed(() => {
      const { widget, properties, items, ...rest } = props.uiSchema
      return rest
    })
    return () => {
      const { rootSchema, errorSchema, ...rest } = props
      const TextWidget = TextWidgetRef.value
      return (
        <TextWidget
          {...rest}
          errors={errorSchema.__errors}
          options={widgetOptionsRef.value}
        />
      )
    }
  },
})
