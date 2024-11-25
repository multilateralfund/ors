import { filter, find, includes, isNull } from 'lodash'

import {
  getUnitAwareValue,
  parseNumber,
  sumFloats,
} from '@ors/helpers/Utils/Utils'

const aggFuncs = {
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
      value = getUnitAwareValue(
        node.data,
        props.colDef.field,
        props.unitOverride || props.context?.unit,
        node.data.gwp,
        node.data.odp,
      )
      if (!isNull(value)) {
        values.push(value)
      }
    })
    return values.length > 0 ? sumFloats(values) : 0
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
          sumFloats(
            recordUsages.map(
              (usage: any) =>
                getUnitAwareValue(
                  usage,
                  'quantity',
                  props.unitOverride || props.context?.unit,
                  node.data.gwp,
                  node.data.odp,
                ) ?? 0,
            ),
          ),
        )
      } else if (usageId === 'total_refrigeration') {
        value = parseNumber(
          sumFloats(
            filter(recordUsages, (usage) =>
              includes([6, 7], usage.usage_id),
            ).map(
              (usage: any) =>
                getUnitAwareValue(
                  usage,
                  'quantity',
                  props.unitOverride || props.context?.unit,
                  node.data.gwp,
                  node.data.odp,
                ) ?? 0,
            ),
          ),
        )
      } else {
        const usage = find(
          recordUsages,
          (item) =>
            item.usage_id === usageId &&
            !includes(node.data.excluded_usages, usageId),
        )
        value = getUnitAwareValue(
          usage,
          'quantity',
          props.unitOverride || props.context?.unit,
          node.data.gwp,
          node.data.odp,
        )
      }
      if (!isNull(value)) {
        values.push(value)
      }
    })
    return values.length > 0 ? sumFloats(values) : 0
  },
}

export default aggFuncs
