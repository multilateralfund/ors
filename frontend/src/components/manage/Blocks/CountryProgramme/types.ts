export type SectionMeta = {
  allowFullScreen?: boolean
  component: React.FC<any>
  id: string
  label: string
  note?: string
  panelId: string
  title: string
}

export type DefaultComponentType = () => JSX.Element
