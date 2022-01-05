import { isObject } from './utils'
import {
  computed,
  defineComponent,
  inject,
  PropType,
  provide,
  ComputedRef,
  ref,
  ExtractPropTypes,
  shallowRef,
} from 'vue'
import { useVJSFContext } from './context'
import {
  Theme,
  SelectionWidgetNames,
  CommonWidgetNames,
  CommonWidgetDefine,
  FieldPropsDefine,
} from './types'

const THEME_PROVIDER_KEY = Symbol()

const ThemeProvider = defineComponent({
  name: 'VJSFThemeProvider',
  props: {
    theme: {
      type: Object as PropType<Theme>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const context = computed(() => props.theme)

    provide(THEME_PROVIDER_KEY, context)
    return () => slots.default && slots.default()
  },
})

export default ThemeProvider

export function getWidget<T extends SelectionWidgetNames | CommonWidgetNames>(
  name: T,
  props?: ExtractPropTypes<typeof FieldPropsDefine>,
) {
  const formContext = useVJSFContext()

  if (props) {
    const { uiSchema, schema } = props
    if (uiSchema?.widget && isObject(uiSchema.widget)) {
      return shallowRef(uiSchema.widget as CommonWidgetDefine)
    }
    if (schema.format) {
      if (formContext.formatMapRef.value[schema.format]) {
        return shallowRef(formContext.formatMapRef.value[schema.format])
      }
    }
  }

  const context: ComputedRef<Theme> | undefined =
    inject<ComputedRef<Theme>>(THEME_PROVIDER_KEY)
  if (!context) {
    throw new Error('vjsf theme required')
  }
  const widgetRef = computed(() => {
    return context.value.widgets[name]
  })

  return widgetRef
}
