import type { DeserializedSubstance } from '@ors/models/Section'
import type { ReportVariant } from '@ors/types/variants'

import React from 'react'

export type CPRowData = {
  count?: number
  display_name?: string
  field?: string
  id?: number
  row_id: string
  rowType?: string
  tooltip?: boolean
}

export interface CPContext {
  is_diff?: boolean
  section?: SectionMeta
  unit?: 'gwp' | 'mt' | 'odp'
  variant?: ReportVariant
  year?: number | string
}

export type SectionMeta = {
  allowFullScreen?: boolean
  component: React.FC<any>
  id: string
  label: string
  note?: string
  panelId: string
  title: string
}

export type DefaultComponentType = () => React.JSX.Element

export type DispatchWithLocalStorage<A> = (
  value: A,
  updateLocalStorage: boolean,
) => void
