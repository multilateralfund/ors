import { useCallback, useEffect, useState } from 'react'
import { Checkbox } from '@mui/material'

export function APRSelectAllCheckbox({ api }: { api: any }) {
  const getState = useCallback(() => {
    let total = 0
    let selected = 0
    api.forEachNodeAfterFilter((node: any) => {
      if (node.selectable !== false) {
        total++
        if (node.isSelected()) selected++
      }
    })
    if (total === 0 || selected === 0) return 'unchecked'
    if (selected === total) return 'checked'
    return 'indeterminate'
  }, [api])

  const [state, setState] = useState<'checked' | 'unchecked' | 'indeterminate'>(getState)

  useEffect(() => {
    const onSelectionChanged = () => setState(getState())
    api.addEventListener('selectionChanged', onSelectionChanged)
    return () => api.removeEventListener('selectionChanged', onSelectionChanged)
  }, [api, getState])

  const handleChange = () => {
    if (state === 'checked') api.deselectAll()
    else api.selectAllFiltered()
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Checkbox
        size="small"
        className="p-0"
        checked={state === 'checked'}
        indeterminate={state === 'indeterminate'}
        onChange={handleChange}
      />
    </div>
  )
}

export default function SelectionCheckbox({ node }: { node: any }) {
  const [selected, setSelected] = useState(node.isSelected() ?? false)

  useEffect(() => {
    const onRowSelected = () => setSelected(node.isSelected() ?? false)
    node.addEventListener('rowSelected', onRowSelected)
    return () => node.removeEventListener('rowSelected', onRowSelected)
  }, [node])

  if (node.selectable === false) {
    return (
      <div className="flex h-full items-center justify-center">
        <Checkbox disabled size="small" className="p-0" />
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Checkbox
        size="small"
        className="p-0"
        checked={selected}
        onChange={() => node.setSelected(!node.isSelected())}
      />
    </div>
  )
}
