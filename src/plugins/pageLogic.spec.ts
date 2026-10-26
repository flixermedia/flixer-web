import { describe, expect, it } from 'vitest'
import { activeTab, applyQuery, buildActionBody, coerceFormValues, initialFormValues, pagerState, planActionOutcome, queryFromRoute, resolveNav, toastKind } from './pageLogic'
import type { PluginField } from './viewTypes'

describe('query helpers', () => {
  it('flattens router queries to strings', () => {
    expect(queryFromRoute({ a: 'x', b: ['y', 'z'], c: null, d: [null] })).toEqual({ a: 'x', b: 'y' })
  })

  it('applies patches, removing empty values and reset keys', () => {
    expect(applyQuery({ tab: 'a', q: 'x', page: '3' }, { q: 'new' }, ['page'])).toEqual({ tab: 'a', q: 'new' })
    expect(applyQuery({ tab: 'a', q: 'x' }, { q: '' })).toEqual({ tab: 'a' })
  })

  it('honors merge when resolving a nav', () => {
    const current = { tab: 'discover', q: 'dune' }
    expect(resolveNav(current, { query: { type: 'movie' }, merge: true })).toEqual({ tab: 'discover', q: 'dune', type: 'movie' })
    expect(resolveNav(current, { query: { type: 'movie' }, merge: false })).toEqual({ type: 'movie' })
    expect(resolveNav(current, { query: { q: '' }, merge: true })).toEqual({ tab: 'discover' })
  })

  it('picks the active tab with a default of the first', () => {
    const tabs = [{ id: 'a' }, { id: 'b' }]
    expect(activeTab(tabs, { tab: 'b' }, 'tab')).toBe('b')
    expect(activeTab(tabs, { tab: 'zzz' }, 'tab')).toBe('a')
    expect(activeTab(tabs, {}, 'tab')).toBe('a')
    expect(activeTab([], {}, 'tab')).toBeUndefined()
  })

  it('computes pager state', () => {
    expect(pagerState(1, 20, 45)).toMatchObject({ pages: 3, current: 1, first: 1, last: 20, hasPrev: false, hasNext: true })
    expect(pagerState(3, 20, 45)).toMatchObject({ first: 41, last: 45, hasPrev: true, hasNext: false })
    expect(pagerState(9, 20, 45)).toMatchObject({ current: 3 })
    expect(pagerState(1, 20, 0)).toMatchObject({ pages: 1, first: 0, last: 0, hasNext: false })
  })
})

describe('form values', () => {
  const fields: PluginField[] = [
    { name: 'name', type: 'text', value: 'abc' },
    { name: 'limit', type: 'number', value: 5 },
    { name: 'on', type: 'checkbox', value: true },
    { name: 'off', type: 'checkbox' },
    { name: 'kind', type: 'select', options: [{ value: 'x', label: 'X' }] },
    { name: 'pw', type: 'password', value: 'ignored' },
    { name: 'sw', type: 'switch', value: true },
    { name: 'ph', type: 'select', placeholder: 'Pick', options: [{ value: 'x', label: 'X' }] },
  ]

  it('builds initial values', () => {
    expect(initialFormValues(fields)).toEqual({ name: 'abc', limit: 5, on: true, off: false, kind: 'x', pw: '', sw: true, ph: '' })
  })

  it('coerces numbers and checkboxes', () => {
    expect(coerceFormValues(fields, { name: 'n', limit: '12.5', on: true, off: undefined, kind: 'x', pw: 'p' })).toEqual({ name: 'n', limit: 12.5, on: true, off: false, kind: 'x', pw: 'p', sw: false, ph: '' })
    expect(coerceFormValues(fields, { limit: '' })).toMatchObject({ limit: null })
    expect(coerceFormValues(fields, { limit: 'abc' })).toMatchObject({ limit: null })
    expect(coerceFormValues(fields, { limit: 7 })).toMatchObject({ limit: 7 })
  })

  it('merges field values over the action body', () => {
    expect(buildActionBody({ op: 'x', body: { id: '1', name: 'old' } }, { name: 'new' })).toEqual({ id: '1', name: 'new' })
    expect(buildActionBody({ op: 'x' })).toEqual({})
  })
})

describe('planActionOutcome', () => {
  it('surfaces response errors and does nothing else', () => {
    expect(planActionOutcome({ op: 'x', reload: true }, { error: 'No', navigate: { query: {}, merge: false } })).toEqual({ error: 'No', reload: false })
  })

  it('prefers the response navigate, then the action navigate, then reload', () => {
    const responseNav = { query: { a: '1' }, merge: false }
    const actionNav = { query: { b: '2' }, merge: true }
    expect(planActionOutcome({ op: 'x', navigate: actionNav, reload: true }, { navigate: responseNav })).toMatchObject({ navigate: responseNav, reload: false })
    expect(planActionOutcome({ op: 'x', navigate: actionNav, reload: true }, {})).toMatchObject({ navigate: actionNav, reload: false })
    expect(planActionOutcome({ op: 'x', reload: true }, {})).toMatchObject({ navigate: undefined, reload: true })
    expect(planActionOutcome({ op: 'x' }, { reload: true })).toMatchObject({ reload: true })
    expect(planActionOutcome({ op: 'x' }, {})).toMatchObject({ reload: false })
  })

  it('passes the toast through', () => {
    expect(planActionOutcome({ op: 'x' }, { toast: { text: 'Done', tone: 'success' } }).toast).toEqual({ text: 'Done', tone: 'success' })
  })

  it('maps toast tones to notify kinds', () => {
    expect(toastKind('success')).toBe('success')
    expect(toastKind('danger')).toBe('error')
    expect(toastKind('warning')).toBe('info')
    expect(toastKind(undefined)).toBe('info')
  })
})
