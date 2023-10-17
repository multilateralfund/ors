import { filter } from 'lodash'

import defaultColDef from './defaultColDef'

const defaultWidths: Record<string, any> = {
  adm_c_description: [
    { max: Infinity, min: 1200, value: 600 },
    { max: 1199, min: 768, value: 600 },
    { max: 767, min: -Infinity, value: 600 },
  ],
  type_of_action: [
    { max: Infinity, min: 1200, value: 600 },
    { max: 1199, min: 768, value: 600 },
    { max: 767, min: -Infinity, value: 600 },
  ],
}

function getWidth(id: string) {
  const widths = defaultWidths[id]

  if (!widths || __SERVER__) return defaultColDef.minWidth
  const width = filter(
    widths,
    (width) => width.min <= window.innerWidth && width.max >= window.innerWidth,
  )
  return width[0].value || defaultColDef.minWidth
}

/* eslint-disable perfectionist/sort-objects */
export default function getAdmsColDef() {
  return {
    type_of_action: {
      initialWidth: getWidth('type_of_action'),
    },
    adm_c_description: {
      initialWidth: getWidth('adm_c_description'),
    },
    B_all_other_ods_date: {
      headerComponentParams: {
        footnote: 1,
        info: 'If Yes, since when (Date) / If No, planned date',
      },
      headerName: 'Date',
    },
    B_cfc_date: {
      headerComponentParams: {
        footnote: 1,
        info: 'If Yes, since when (Date) / If No, planned date',
      },
      headerName: 'Date',
    },
    B_hcfc_date: {
      headerComponentParams: {
        footnote: 1,
        info: 'If Yes, since when (Date) / If No, planned date',
      },
      headerName: 'Date',
    },
  }
}
