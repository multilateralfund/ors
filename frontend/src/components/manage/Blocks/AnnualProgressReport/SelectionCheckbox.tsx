import { useEffect, useState } from 'react'
import { Checkbox } from '@mui/material'

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
