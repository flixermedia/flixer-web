export interface NavLink {
  label: string
  to: string
}

export interface NavTab extends NavLink {
  icon: string
}
