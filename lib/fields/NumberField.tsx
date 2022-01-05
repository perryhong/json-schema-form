import { FieldPropsDefine, CommonWidgetNames } from '../types'
import { computed, defineComponent } from 'vue'

import { getWidget } from '../theme'

export default defineComponent({
  name: 'NumberField',
  props: FieldPropsDefine,
  setup(props) {
    const NumberWidgetRef = computed(() => {
      const widgetRef = getWidget(CommonWidgetNames.NumberWidget, props)
      return widgetRef.value
    })
    return () => {
      const { rootSchema, errorSchema, ...rest } = props
      const NumberWidget = NumberWidgetRef.value
      return <NumberWidget {...rest} errors={errorSchema.__errors} />
    }
  },
})
