/** Sanitized server-driven UI model. Only `viewSchema.ts` produces these; the renderer trusts them. */

export type Tone = 'default' | 'muted' | 'danger' | 'success' | 'warning'
export type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info'
export type AlertTone = 'info' | 'warning' | 'danger' | 'success'
export type ImageAspect = 'poster' | 'square' | 'wide'
export type ButtonVariant = 'primary' | 'quiet' | 'danger'
export type SubmitVariant = 'primary' | 'quiet'
export type FieldType = 'text' | 'password' | 'number' | 'checkbox' | 'select' | 'textarea' | 'hidden'

export interface PluginNav {
  query: Record<string, string>
  merge: boolean
}

export interface PluginAction {
  op: string
  body?: Record<string, unknown>
  navigate?: PluginNav
  reload?: boolean
  confirm?: string
}

export interface PluginToast {
  text: string
  tone?: BadgeTone
}

export interface PluginActionResponse {
  toast?: PluginToast
  navigate?: PluginNav
  reload?: boolean
  error?: string
}

export interface PluginImage {
  src: string
  alt: string
  aspect?: ImageAspect
}

export interface PluginBadge {
  text: string
  tone?: BadgeTone
}

export interface FieldOption {
  value: string
  label: string
}

export interface PluginField {
  name: string
  label?: string
  type: FieldType
  value?: string | number | boolean
  placeholder?: string
  help?: string
  required?: boolean
  options?: FieldOption[]
  min?: number
  max?: number
}

export interface TableColumn {
  key: string
  label: string
}

export type TableCell = ViewNode | string | number | null

export interface TableRow {
  key?: string
  cells: Record<string, TableCell>
}

export interface TabDef {
  id: string
  label: string
  children: ViewNode[]
}

export interface StackNode {
  type: 'stack'
  direction?: 'column' | 'row'
  gap?: number
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'between'
  children: ViewNode[]
}
export interface HeadingNode {
  type: 'heading'
  text: string
  level?: 1 | 2 | 3
}
export interface TextNode {
  type: 'text'
  text: string
  tone?: Tone
  size?: 'sm' | 'md'
}
export interface BadgeNode {
  type: 'badge'
  text: string
  tone?: BadgeTone
}
export interface ImageNode extends PluginImage {
  type: 'image'
}
export interface GridNode {
  type: 'grid'
  minWidth?: number
  children: ViewNode[]
}
export interface CardNode {
  type: 'card'
  title?: string
  subtitle?: string
  image?: PluginImage
  badges?: PluginBadge[]
  to?: PluginNav
  children?: ViewNode[]
  actions?: ViewNode[]
}
export interface TabsNode {
  type: 'tabs'
  param: string
  tabs: TabDef[]
  reset?: string[]
}
export interface TableNode {
  type: 'table'
  columns: TableColumn[]
  rows: TableRow[]
  emptyText?: string
}
export interface FormNode {
  type: 'form'
  fields: PluginField[]
  submit: { label: string; action: PluginAction; variant?: SubmitVariant }
  layout?: 'column' | 'inline'
}
export interface ButtonNode {
  type: 'button'
  label: string
  action: PluginAction
  variant?: ButtonVariant
  confirm?: string
  disabled?: boolean
}
export interface LinkNode {
  type: 'link'
  label: string
  to: PluginNav
}
export interface DividerNode {
  type: 'divider'
}
export interface EmptyNode {
  type: 'empty'
  text: string
}
export interface AlertNode {
  type: 'alert'
  text: string
  tone?: AlertTone
}
export interface PagerNode {
  type: 'pager'
  param: string
  page: number
  pageSize: number
  total: number
}
export interface SearchboxNode {
  type: 'searchbox'
  param: string
  value?: string
  placeholder?: string
  reset?: string[]
}
export interface ChipsNode {
  type: 'chips'
  param: string
  options: FieldOption[]
  value?: string
  reset?: string[]
}

export type ViewNode =
  | StackNode
  | HeadingNode
  | TextNode
  | BadgeNode
  | ImageNode
  | GridNode
  | CardNode
  | TabsNode
  | TableNode
  | FormNode
  | ButtonNode
  | LinkNode
  | DividerNode
  | EmptyNode
  | AlertNode
  | PagerNode
  | SearchboxNode
  | ChipsNode

export interface PluginPageResponse {
  title?: string
  view: ViewNode
}
