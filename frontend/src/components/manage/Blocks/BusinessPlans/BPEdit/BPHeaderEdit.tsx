import BPHeaderView from '../BPHeaderView'

export default function BPHeaderEdit() {
  return (
    <BPHeaderView
      actions={<></>}
      tag={<></>}
      titlePrefix={<span className="text-4xl">Editing: </span>}
      viewType="edit"
    />
  )
}
