import React, { useCallback } from 'react'
import { BasePasteWrapper } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport/BasePasteWrapper.tsx'

type HeaderPasteWrapperProps = {
  field: string
} & Omit<React.ComponentProps<typeof BasePasteWrapper>, 'mutator'>

export function HeaderPasteWrapper(props: HeaderPasteWrapperProps) {
  const { field, ...rest } = props
  const mutateRow = useCallback(
    function (row: any, value: any) {
      row[field] = value
    },
    [field],
  )

  return <BasePasteWrapper mutator={mutateRow} {...rest} />
}
