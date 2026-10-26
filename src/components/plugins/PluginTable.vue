<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TableCell, TableNode, ViewNode } from '../../plugins/viewTypes'
import PluginNode from './PluginNode.vue'

defineProps<{ node: TableNode }>()
const { t } = useI18n()

function cellNode(cell: TableCell | undefined): ViewNode | null {
  return cell !== null && typeof cell === 'object' ? cell : null
}
</script>

<template>
  <div class="admin-card overflow-x-auto">
    <table class="w-full min-w-max text-left text-sm">
      <thead class="border-b border-flixer-border text-xs uppercase tracking-wide text-flixer-muted">
        <tr>
          <th v-for="column in node.columns" :key="column.key" scope="col" class="px-4 py-3 font-semibold">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in node.rows" :key="row.key ?? index" class="border-b border-flixer-border/60 last:border-0">
          <td v-for="column in node.columns" :key="column.key" class="px-4 py-3 align-middle">
            <PluginNode v-if="cellNode(row.cells[column.key])" :node="cellNode(row.cells[column.key])!" />
            <template v-else>{{ row.cells[column.key] ?? '' }}</template>
          </td>
        </tr>
        <tr v-if="!node.rows.length">
          <td :colspan="Math.max(1, node.columns.length)" class="px-4 py-8 text-center text-flixer-muted">{{ node.emptyText ?? t('plugins.view.empty') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
