import { filter, find, includes, isNull, sum } from 'lodash'

import { AgAdmCellRenderer } from '@ors/components/manage/AgCellRenderers/AgAdmCellRenderer'
import AgBooleanCellRenderer from '@ors/components/manage/AgCellRenderers/AgBooleanCellRenderer'
import AgDateCellRenderer from '@ors/components/manage/AgCellRenderers/AgDateCellRenderer'
import AgFloatCellRenderer from '@ors/components/manage/AgCellRenderers/AgFloatCellRenderer'
import AgTextCellRenderer from '@ors/components/manage/AgCellRenderers/AgTextCellRenderer'
import AgUsageCellRenderer from '@ors/components/manage/AgCellRenderers/AgUsageCellRenderer'
import AgHeaderComponent from '@ors/components/manage/AgComponents/AgHeaderComponent'
import AgHeaderGroupComponent from '@ors/components/manage/AgComponents/AgHeaderGroupComponent'
import CellAutocompleteWidget from '@ors/components/manage/AgWidgets/CellAutocompleteWidget'
import CellDateWidget from '@ors/components/manage/AgWidgets/CellDateWidget'
import CellNumberWidget from '@ors/components/manage/AgWidgets/CellNumberWidget'
import CellTextareaWidget from '@ors/components/manage/AgWidgets/CellTextareaWidget'
import { parseNumber } from '@ors/helpers/Utils/Utils'

export const aggFuncs = {
  sumTotal: (props: any) => {
    let value: null | number = null
    const values: Array<any> = []
    if (!includes(['subtotal', 'total'], props.data.rowType)) {
      return null
    }
    props.api.forEachNode(function (node: any) {
      if (
        props.data.rowType === 'subtotal' &&
        (!props.data.group || node.data.group !== props.data.group)
      ) {
        return
      }
      value = parseNumber(node.data[props.colDef.field])
      if (!isNull(value)) {
        values.push(value)
      }
    })
    return values.length > 0 ? sum(values) : 0
  },
  sumTotalUsages: (props: any) => {
    let value: null | number = null
    const values: Array<any> = []
    const usageId = props.colDef.id
    if (!includes(['subtotal', 'total'], props.data.rowType)) {
      return null
    }
    props.api.forEachNode(function (node: any) {
      if (
        props.data.rowType === 'subtotal' &&
        (!props.data.group || node.data.group !== props.data.group)
      ) {
        return
      }
      const recordUsages = node.data.record_usages || []

      if (usageId === 'total_usages') {
        value = parseNumber(
          sum(recordUsages.map((usage: any) => parseFloat(usage.quantity))),
        )
      } else if (usageId === 'total_refrigeration') {
        value = parseNumber(
          sum(
            filter(recordUsages, (usage) =>
              includes([6, 7], usage.usage_id),
            ).map((usage: any) => parseFloat(usage.quantity)),
          ),
        )
      } else {
        const usage = find(
          recordUsages,
          (item) =>
            item.usage_id === usageId &&
            !includes(node.data.excluded_usages, usageId),
        )
        value = parseNumber(usage?.quantity)
      }
      if (!isNull(value)) {
        values.push(value)
      }
    })
    return values.length > 0 ? sum(values) : 0
  },
}

export const components = {
  agAdmCellRenderer: AgAdmCellRenderer,
  agBooleanCellRenderer: AgBooleanCellRenderer,
  agColumnHeader: AgHeaderComponent,
  agColumnHeaderGroup: AgHeaderGroupComponent,
  agDateCellEditor: CellDateWidget,
  agDateCellRenderer: AgDateCellRenderer,
  agFloatCellRenderer: AgFloatCellRenderer,
  agNumberCellEditor: CellNumberWidget,
  agSelectCellEditor: CellAutocompleteWidget,
  agTextCellEditor: CellTextareaWidget,
  agTextCellRenderer: AgTextCellRenderer,
  agUsageCellRenderer: AgUsageCellRenderer,
}

export const defaultRenderer = 'agTextCellRenderer'

export const renderers = {
  category: {
    adm: 'agAdmCellRenderer',
    usage: 'agUsageCellRenderer',
  },
  type: {
    boolean: 'agBooleanCellRenderer',
    date: 'agDateCellRenderer',
    number: 'agFloatCellRenderer',
    text: 'agTextCellRenderer',
  },
}
