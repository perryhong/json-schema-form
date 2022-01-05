import { computed, defineComponent, PropType } from 'vue'
import { FieldPropsDefine, SelectionWidgetNames, Schema } from '../types'
import { useVJSFContext } from '../context'
import { createUseStyles } from 'vue-jss'
import { getWidget } from '../theme'

const useStyles = createUseStyles({
  container: {
    border: '1px solid #eee',
  },
  action: {
    background: '#eee',
    padding: 10,
    textAlign: 'right',
  },
  actions: {
    '& + &': {
      marginLeft: 10,
    },
  },
  content: {
    padding: 10,
  },
})

const ArrayItemWrapper = defineComponent({
  name: 'ArrayItemWrapper',
  props: {
    onAdd: {
      type: Function as PropType<(index: number) => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(index: number) => void>,
      required: true,
    },
    onUp: {
      type: Function as PropType<(index: number) => void>,
      required: true,
    },
    onDown: {
      type: Function as PropType<(index: number) => void>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  setup(props, { slots }) {
    const classesRef = useStyles()
    const handleAdd = () => props.onAdd(props.index)
    const handleDelete = () => props.onDelete(props.index)
    const handleUp = () => props.onUp(props.index)
    const handleDown = () => props.onDown(props.index)
    return () => {
      const classes = classesRef.value
      return (
        <div class={classes.container}>
          <div class={classes.action}>
            <button class={classes.actions} onClick={handleAdd}>
              新增
            </button>
            <button class={classes.actions} onClick={handleDelete}>
              删除
            </button>
            <button class={classes.actions} onClick={handleUp}>
              上移
            </button>
            <button class={classes.actions} onClick={handleDown}>
              下移
            </button>
          </div>
          <div class={classes.content}>{slots.default && slots.default()}</div>
        </div>
      )
    }
  },
})

export default defineComponent({
  name: 'ArrayField',
  props: FieldPropsDefine,
  setup(props) {
    const context = useVJSFContext()
    const handleArrayitemChange = (v: any, index: number) => {
      const value: any = Array.isArray(props.value) ? props.value : []
      value[index] = v
      props.onChange(value)
    }
    const handleAdd = (index: number) => {
      const value: any = Array.isArray(props.value) ? props.value : []
      value.splice(index + 1, 0, undefined)
      props.onChange(value)
    }
    const handleDelete = (index: number) => {
      const value: any = Array.isArray(props.value) ? props.value : []
      value.splice(index, 1)
      props.onChange(value)
    }
    const handleUp = (index: number) => {
      if (index === 0) return
      const value: any = Array.isArray(props.value) ? props.value : []
      const temp = value[index]
      value[index] = value[index - 1]
      value[index - 1] = temp
      props.onChange(value)
    }
    const handleDown = (index: number) => {
      const value: any = Array.isArray(props.value) ? props.value : []
      if (index === value.length - 1) return
      const temp = value[index]
      value[index] = value[index + 1]
      value[index + 1] = temp
      props.onChange(value)
    }

    const SelectionWidgetRef = computed(() => {
      const widgetRef = getWidget(SelectionWidgetNames.SelectionWidget, props)
      return widgetRef.value
    })

    return () => {
      const { schema, rootSchema, value, errorSchema, uiSchema } = props
      const { SchemaItem } = context
      const isMultiType = Array.isArray(schema.items)
      const isSelect = schema.items && (schema.items as any).enum
      if (isMultiType) {
        const items: Schema[] = schema.items as any
        const currentValue = Array.isArray(value) ? value : []
        return items.map((s: Schema, index: number) => {
          const itemsUiSchema = uiSchema.items
          const us = Array.isArray(itemsUiSchema)
            ? itemsUiSchema[index] || {}
            : itemsUiSchema || {}
          return (
            <SchemaItem
              schema={s}
              uiSchema={us}
              rootSchema={rootSchema}
              value={currentValue[index]}
              key={index}
              errorSchema={errorSchema[index] || {}}
              onChange={(v: any) => handleArrayitemChange(v, index)}
            />
          )
        })
      } else if (!isSelect) {
        const currentValue = Array.isArray(value) ? value : []
        return currentValue.map((v: any, index: number) => (
          <ArrayItemWrapper
            index={index}
            onAdd={handleAdd}
            onDelete={handleDelete}
            onUp={handleUp}
            onDown={handleDown}
          >
            <SchemaItem
              schema={schema.items as Schema}
              uiSchema={(uiSchema.items as any) || {}}
              rootSchema={rootSchema}
              value={v}
              key={index}
              errorSchema={errorSchema[index] || {}}
              onChange={(v: any) => handleArrayitemChange(v, index)}
            />
          </ArrayItemWrapper>
        ))
      } else {
        const enumOptions = (schema as any).items.enum
        const options = enumOptions.map((e: any) => ({
          key: e,
          value: e,
        }))
        const SelectionWidget = SelectionWidgetRef.value
        return (
          <SelectionWidget
            onChange={props.onChange}
            value={props.value}
            options={options}
            errors={errorSchema.__errors}
            schema={schema}
          />
        )
      }
      return <div>this is array field</div>
    }
  },
})
