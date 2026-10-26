import { describe, expect, it } from 'vitest'
import { MAX_DEPTH, MAX_LABEL, MAX_NODES, safeImageSrc, sanitizeAction, sanitizeActionResponse, sanitizeNav, sanitizePageResponse, sanitizeView } from './viewSchema'
import type { ViewNode } from './viewTypes'

function nest(depth: number): unknown {
  let node: unknown = { type: 'text', text: 'leaf' }
  for (let i = 1; i < depth; i += 1) node = { type: 'stack', children: [node] }
  return node
}

function countNodes(node: ViewNode | null): number {
  if (!node) return 0
  if (node.type === 'stack' || node.type === 'grid') return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
  return 1
}

describe('sanitizeView', () => {
  it('drops unknown types and non-objects', () => {
    expect(sanitizeView({ type: 'script', text: 'x' })).toBeNull()
    expect(sanitizeView('text')).toBeNull()
    expect(sanitizeView(null)).toBeNull()
    expect(sanitizeView({ type: 'stack', children: [{ type: 'nope' }, { type: 'text', text: 'ok' }, 4] })).toEqual({
      type: 'stack',
      children: [{ type: 'text', text: 'ok' }],
    })
  })

  it('keeps nodes up to the maximum depth and drops deeper ones', () => {
    const ok = sanitizeView(nest(MAX_DEPTH))
    let depth = 0
    for (let node: ViewNode | undefined = ok ?? undefined; node; node = node.type === 'stack' ? node.children[0] : undefined) depth += 1
    expect(depth).toBe(MAX_DEPTH)

    const tooDeep = sanitizeView(nest(MAX_DEPTH + 5))
    let deepest = 0
    for (let node: ViewNode | undefined = tooDeep ?? undefined; node; node = node.type === 'stack' ? node.children[0] : undefined) deepest += 1
    expect(deepest).toBe(MAX_DEPTH)
  })

  it('caps the total node count', () => {
    const children = Array.from({ length: 400 }, () => ({ type: 'stack', children: Array.from({ length: 10 }, () => ({ type: 'divider' })) }))
    const view = sanitizeView({ type: 'stack', children })
    expect(countNodes(view)).toBeLessThanOrEqual(MAX_NODES)
    expect(countNodes(view)).toBe(MAX_NODES)
  })

  it('truncates long strings', () => {
    const view = sanitizeView({ type: 'badge', text: 'x'.repeat(MAX_LABEL + 50) })
    expect(view).toMatchObject({ type: 'badge' })
    expect((view as { text: string }).text).toHaveLength(MAX_LABEL)
  })

  it('drops unknown tones and enum values instead of passing them through', () => {
    expect(sanitizeView({ type: 'text', text: 'a', tone: 'rainbow', size: 'huge' })).toEqual({ type: 'text', text: 'a' })
    expect(sanitizeView({ type: 'badge', text: 'a', tone: 'muted' })).toEqual({ type: 'badge', text: 'a' })
    expect(sanitizeView({ type: 'alert', text: 'a', tone: 'default' })).toEqual({ type: 'alert', text: 'a' })
    expect(sanitizeView({ type: 'stack', gap: 99, align: 'weird', direction: 'diagonal', children: [] })).toEqual({ type: 'stack', gap: 8, children: [] })
    expect(sanitizeView({ type: 'heading', text: 'h', level: 7 })).toEqual({ type: 'heading', text: 'h' })
  })

  it('ignores plugin-provided classes and styles', () => {
    const view = sanitizeView({ type: 'text', text: 'a', class: 'text-red-500', className: 'x', style: 'color:red', html: '<b>x</b>' })
    expect(view).toEqual({ type: 'text', text: 'a' })
  })

  it('only allows absolute http(s) image sources', () => {
    expect(sanitizeView({ type: 'image', src: 'https://img.example/p.jpg', alt: 'p', aspect: 'wide' })).toEqual({ type: 'image', src: 'https://img.example/p.jpg', alt: 'p', aspect: 'wide' })
    for (const src of ['javascript:alert(1)', 'data:image/png;base64,AAAA', '//evil.example/x.png', '/relative.png', 'ftp://x/y', 'JaVaScRiPt:alert(1)', 42]) {
      expect(sanitizeView({ type: 'image', src, alt: 'x' })).toBeNull()
    }
    expect(safeImageSrc('http://a.example/x')).toBe('http://a.example/x')
    expect(sanitizeView({ type: 'card', title: 't', image: { src: 'javascript:1', alt: '' } })).toMatchObject({ type: 'card', image: undefined })
  })

  it('validates nav shape', () => {
    expect(sanitizeNav({ query: { tab: 'discover', page: 2, flag: true, bad: { a: 1 } }, merge: true })).toEqual({ query: { tab: 'discover', page: '2', flag: 'true' }, merge: true })
    expect(sanitizeNav({ query: { tab: 'x' } })).toEqual({ query: { tab: 'x' }, merge: false })
    expect(sanitizeNav({ query: { 'bad key!': 'x', __proto__: 'x' } })).toEqual({ query: {}, merge: false })
    expect(sanitizeNav('https://example.com')).toBeUndefined()
    expect(sanitizeNav({ query: 'tab=x' })).toBeUndefined()
    expect(sanitizeView({ type: 'link', label: 'go', to: 'javascript:alert(1)' })).toBeNull()
    expect(sanitizeView({ type: 'link', label: 'go', to: { query: { a: 'b' } } })).toEqual({ type: 'link', label: 'go', to: { query: { a: 'b' }, merge: false } })
  })

  it('validates action shape', () => {
    expect(sanitizeAction({ op: 'approve', body: { id: '1', nested: { n: [1, 2] } }, reload: true, confirm: 'Sure?', navigate: { query: { tab: 'a' } } })).toEqual({
      op: 'approve',
      body: { id: '1', nested: { n: [1, 2] } },
      reload: true,
      confirm: 'Sure?',
      navigate: { query: { tab: 'a' }, merge: false },
    })
    expect(sanitizeAction({ op: '../evil' })).toBeUndefined()
    expect(sanitizeAction({ op: 'a/b' })).toBeUndefined()
    expect(sanitizeAction({ body: {} })).toBeUndefined()
    expect(sanitizeAction('approve')).toBeUndefined()
    expect(sanitizeView({ type: 'button', label: 'x', action: { op: 'bad op' } })).toBeNull()
    expect(sanitizeView({ type: 'button', label: 'x', action: { op: 'ok' }, variant: 'fancy' })).toEqual({ type: 'button', label: 'x', action: { op: 'ok' } })
  })

  it('does not let __proto__ keys pollute action bodies', () => {
    const action = sanitizeAction(JSON.parse('{"op":"x","body":{"__proto__":{"polluted":true},"a":1}}'))
    expect(action?.body).toEqual({ a: 1 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('sanitizes forms: fields, password prefill and submit', () => {
    const view = sanitizeView({
      type: 'form',
      fields: [
        { name: 'url', label: 'URL', type: 'text', value: 'https://x', required: true },
        { name: 'secret', type: 'password', value: 'hunter2' },
        { name: 'kind', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 5 }, { label: 'no value' }] },
        { name: 'bad name', type: 'text' },
        { name: 'x', type: 'color' },
        { name: 'n', type: 'number', value: 4, min: 1, max: 9 },
      ],
      submit: { label: 'Save', action: { op: 'save' } },
    }) as Extract<ViewNode, { type: 'form' }>
    expect(view.fields.map((field) => field.name)).toEqual(['url', 'secret', 'kind', 'n'])
    expect(view.fields[1]).not.toHaveProperty('value')
    expect(view.fields[2].options).toEqual([
      { value: 'a', label: 'A' },
      { value: '5', label: '5' },
    ])
    expect(view.submit).toEqual({ label: 'Save', action: { op: 'save' } })
    expect(sanitizeView({ type: 'form', fields: [], submit: { label: 'x', action: { op: 'bad op' } } })).toBeNull()
    expect(sanitizeView({ type: 'form', fields: [] })).toBeNull()
  })

  it('supports switch, disabled and hasValue on fields', () => {
    const view = sanitizeView({
      type: 'form',
      fields: [
        { name: 'on', type: 'switch', label: 'On', value: true, help: 'h', disabled: true },
        { name: 'key', type: 'password', hasValue: true, value: 'leak' },
        { name: 'plain', type: 'text', hasValue: true },
        { name: 'kind', type: 'select', placeholder: 'Choose…', options: [{ value: 'a', label: 'A' }] },
      ],
      submit: { label: 'Save', action: { op: 'save' } },
    }) as Extract<ViewNode, { type: 'form' }>
    expect(view.fields[0]).toMatchObject({ type: 'switch', value: true, help: 'h', disabled: true })
    expect(view.fields[1]).toMatchObject({ type: 'password', hasValue: true })
    expect(view.fields[1]).not.toHaveProperty('value')
    expect(view.fields[2]).not.toHaveProperty('hasValue')
    expect(view.fields[3]).toMatchObject({ placeholder: 'Choose…', options: [{ value: 'a', label: 'A' }] })
  })

  it('sanitizes sections and counts their children against the limits', () => {
    expect(sanitizeView({ type: 'section', title: 'T', description: 'D', actions: [{ type: 'button', label: 'Go', action: { op: 'go' } }, { type: 'nope' }], children: [{ type: 'divider' }], class: 'x' })).toEqual({
      type: 'section',
      title: 'T',
      description: 'D',
      actions: [{ type: 'button', label: 'Go', action: { op: 'go' } }],
      children: [{ type: 'divider' }],
    })
    expect(sanitizeView({ type: 'section' })).toEqual({ type: 'section', actions: [], children: [] })
    const deep = { type: 'section', children: [nest(MAX_DEPTH)] }
    const result = sanitizeView(deep) as Extract<ViewNode, { type: 'section' }>
    let depth = 1
    for (let node: ViewNode | undefined = result.children?.[0]; node; node = node.type === 'stack' ? node.children[0] : undefined) depth += 1
    expect(depth).toBe(MAX_DEPTH)
  })

  it('sanitizes tables and nested cell nodes', () => {
    const view = sanitizeView({
      type: 'table',
      columns: [{ key: 'name', label: 'Name' }, { key: 'act', label: '' }, { label: 'no key' }],
      rows: [
        { key: 'r1', cells: { name: 'A', act: { type: 'button', label: 'Go', action: { op: 'go' } }, other: 'dropped' } },
        { cells: { name: 3, act: null } },
        'junk',
      ],
    }) as Extract<ViewNode, { type: 'table' }>
    expect(view.columns.map((column) => column.key)).toEqual(['name', 'act'])
    expect(view.rows).toHaveLength(2)
    expect(view.rows[0].cells).toEqual({ name: 'A', act: { type: 'button', label: 'Go', action: { op: 'go' } } })
    expect(view.rows[1].cells).toEqual({ name: 3, act: null })
  })

  it('sanitizes tabs, pager, searchbox and chips', () => {
    expect(sanitizeView({ type: 'tabs', param: 'tab', reset: ['page', 'bad key'], tabs: [{ id: 'a', label: 'A', children: [{ type: 'divider' }] }, { label: 'no id' }] })).toEqual({
      type: 'tabs',
      param: 'tab',
      reset: ['page'],
      tabs: [{ id: 'a', label: 'A', children: [{ type: 'divider' }] }],
    })
    expect(sanitizeView({ type: 'tabs', param: 'bad key', tabs: [] })).toBeNull()
    expect(sanitizeView({ type: 'pager', param: 'page', page: 0, pageSize: 20, total: -4 })).toEqual({ type: 'pager', param: 'page', page: 1, pageSize: 20, total: 0 })
    expect(sanitizeView({ type: 'pager', param: 'page', page: 'x', pageSize: 20, total: 4 })).toBeNull()
    expect(sanitizeView({ type: 'searchbox', param: 'q', value: 'hi', reset: ['page'] })).toEqual({ type: 'searchbox', param: 'q', value: 'hi', reset: ['page'] })
    expect(sanitizeView({ type: 'chips', param: 'type', value: 'movie', options: [{ value: 'movie', label: 'Movies' }] })).toEqual({ type: 'chips', param: 'type', value: 'movie', options: [{ value: 'movie', label: 'Movies' }] })
  })

  it('sanitizes cards with badges, image and actions', () => {
    const view = sanitizeView({
      type: 'card',
      title: 'T',
      image: { src: 'https://x/y.jpg', alt: 'y' },
      badges: [{ text: 'Pending', tone: 'warning' }, { text: 'x', tone: 'nope' }, {}],
      to: { query: { id: '1' } },
      actions: [{ type: 'button', label: 'Go', action: { op: 'go' } }],
    })
    expect(view).toMatchObject({
      type: 'card',
      title: 'T',
      image: { src: 'https://x/y.jpg', alt: 'y' },
      badges: [{ text: 'Pending', tone: 'warning' }, { text: 'x' }],
      to: { query: { id: '1' }, merge: false },
      actions: [{ type: 'button' }],
    })
  })
})

describe('sanitizePageResponse', () => {
  it('requires a valid view', () => {
    expect(sanitizePageResponse({ title: 'Requests', view: { type: 'divider' } })).toEqual({ title: 'Requests', view: { type: 'divider' } })
    expect(sanitizePageResponse({ title: 'x', view: { type: 'bogus' } })).toBeNull()
    expect(sanitizePageResponse(null)).toBeNull()
    expect(sanitizePageResponse({})).toBeNull()
  })
})

describe('sanitizeActionResponse', () => {
  it('keeps only known well-formed fields', () => {
    expect(sanitizeActionResponse({ toast: { text: 'Saved', tone: 'success' }, navigate: { query: { tab: 'a' }, merge: true }, reload: true, error: '', extra: 1 })).toEqual({
      toast: { text: 'Saved', tone: 'success' },
      navigate: { query: { tab: 'a' }, merge: true },
      reload: true,
    })
    expect(sanitizeActionResponse({ toast: { text: 'x', tone: 'purple' }, error: 'Nope' })).toEqual({ toast: { text: 'x' }, error: 'Nope' })
    expect(sanitizeActionResponse(null)).toEqual({})
    expect(sanitizeActionResponse('ok')).toEqual({})
  })
})
