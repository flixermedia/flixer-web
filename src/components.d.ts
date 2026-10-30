import type { Icon } from '@iconify/vue'

declare module 'vue' {
  export interface GlobalComponents {
    Icon: typeof Icon
  }
}
