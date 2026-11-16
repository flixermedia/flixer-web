const TOOLTIP_ID = 'flixer-icon-button-tooltip'
const TOOLTIP_GAP = 8
const VIEWPORT_GUTTER = 8

type TooltipBox = Pick<DOMRect, 'left' | 'top' | 'bottom' | 'width' | 'height'>

export function iconTooltipPosition(
  trigger: TooltipBox,
  tooltip: Pick<DOMRect, 'width' | 'height'>,
  viewport: { width: number; height: number },
) {
  const left = Math.max(
    VIEWPORT_GUTTER,
    Math.min(trigger.left + trigger.width / 2 - tooltip.width / 2, viewport.width - tooltip.width - VIEWPORT_GUTTER),
  )
  const below = trigger.bottom + TOOLTIP_GAP
  const top = below + tooltip.height <= viewport.height - VIEWPORT_GUTTER
    ? below
    : Math.max(VIEWPORT_GUTTER, trigger.top - tooltip.height - TOOLTIP_GAP)
  return { top, left }
}

let tooltip: HTMLDivElement | null = null
let hoveredButton: HTMLButtonElement | null = null
let focusedButton: HTMLButtonElement | null = null
let describedButton: HTMLButtonElement | null = null
let addedDescription = false
let initialized = false

function buttonFromTarget(target: EventTarget | null): HTMLButtonElement | null {
  return target instanceof Element ? target.closest('button') : null
}

function hasVisibleText(button: HTMLButtonElement): boolean {
  const content = button.cloneNode(true) as HTMLButtonElement
  content.querySelectorAll('svg, [aria-hidden="true"], [hidden], .hidden, .sr-only, .invisible').forEach((element) => element.remove())
  const text = content.textContent?.trim() ?? ''
  return text.length > 0 && !/^\d+\+?$/.test(text)
}

function tooltipLabel(button: HTMLButtonElement): string | null {
  if (hasVisibleText(button)) return null

  const labelledBy = button.getAttribute('aria-labelledby')
    ?.split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
  const title = button.getAttribute('title')?.trim() || button.dataset.flixerTooltipTitle
  const label = button.getAttribute('aria-label')?.trim() || labelledBy || title
  if (!label) return null

  if (button.hasAttribute('title')) {
    button.dataset.flixerTooltipTitle = button.getAttribute('title') ?? ''
    button.removeAttribute('title')
  }
  return label
}

function ensureTooltip(): HTMLDivElement {
  if (tooltip) return tooltip

  tooltip = document.createElement('div')
  tooltip.id = TOOLTIP_ID
  tooltip.className = 'flixer-icon-button-tooltip'
  tooltip.setAttribute('role', 'tooltip')
  tooltip.hidden = true
  document.body.append(tooltip)
  return tooltip
}

function clearDescription() {
  if (!describedButton) return
  if (addedDescription) {
    const ids = (describedButton.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== TOOLTIP_ID)
    if (ids.length) describedButton.setAttribute('aria-describedby', ids.join(' '))
    else describedButton.removeAttribute('aria-describedby')
  }
  describedButton = null
  addedDescription = false
}

function describeButton(button: HTMLButtonElement) {
  if (describedButton === button) return
  clearDescription()
  const ids = (button.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  addedDescription = !ids.includes(TOOLTIP_ID)
  if (addedDescription) button.setAttribute('aria-describedby', [...ids, TOOLTIP_ID].join(' '))
  describedButton = button
}

function hideTooltip() {
  if (tooltip) tooltip.hidden = true
  clearDescription()
}

function showTooltip(button: HTMLButtonElement, label: string) {
  const element = ensureTooltip()
  describeButton(button)
  element.textContent = label
  element.hidden = false
  element.style.visibility = 'hidden'

  const triggerRect = button.getBoundingClientRect()
  const tooltipRect = element.getBoundingClientRect()
  const position = iconTooltipPosition(
    triggerRect,
    tooltipRect,
    { width: window.innerWidth, height: window.innerHeight },
  )
  element.style.left = `${position.left}px`
  element.style.top = `${position.top}px`
  element.style.visibility = ''
}

function refreshTooltip() {
  if (hoveredButton && !hoveredButton.isConnected) hoveredButton = null
  if (focusedButton && !focusedButton.isConnected) focusedButton = null

  for (const button of [hoveredButton, focusedButton]) {
    if (!button) continue
    const label = tooltipLabel(button)
    if (label) {
      showTooltip(button, label)
      return
    }
  }
  hideTooltip()
}

function isWithin(button: HTMLButtonElement, target: EventTarget | null): boolean {
  return target instanceof Node && button.contains(target)
}

function onPointerOver(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  const button = buttonFromTarget(event.target)
  if (!button || isWithin(button, event.relatedTarget)) return
  hoveredButton = button
  refreshTooltip()
}

function onPointerOut(event: PointerEvent) {
  const button = buttonFromTarget(event.target)
  if (!button || isWithin(button, event.relatedTarget) || button !== hoveredButton) return
  hoveredButton = null
  refreshTooltip()
}

function onFocusIn(event: FocusEvent) {
  focusedButton = buttonFromTarget(event.target)
  refreshTooltip()
}

function onFocusOut(event: FocusEvent) {
  const button = buttonFromTarget(event.target)
  if (!button || isWithin(button, event.relatedTarget) || button !== focusedButton) return
  focusedButton = null
  refreshTooltip()
}

function onClick() {
  queueMicrotask(refreshTooltip)
}

export function initializeIconButtonTooltips(): void {
  if (initialized) return
  initialized = true
  document.addEventListener('pointerover', onPointerOver)
  document.addEventListener('pointerout', onPointerOut)
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
  document.addEventListener('click', onClick)
  document.addEventListener('scroll', refreshTooltip, true)
  window.addEventListener('resize', refreshTooltip)
}
