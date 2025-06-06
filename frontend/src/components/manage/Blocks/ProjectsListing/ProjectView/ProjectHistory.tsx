import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'

type ProjectHistoryProps = {
  project: ProjectTypeApi
  mode: string
}

const HistoryItem = ({ item }: { item: ProjectTypeApi['history'][0] }) => {
  let fullName = item.user.username
  if (item.user.first_name && item.user.last_name) {
    fullName = `${item.user.first_name} ${item.user.last_name}`
  } else if (item.user.first_name) {
    fullName = item.user.first_name
  } else if (item.user.last_name) {
    fullName = item.user.last_name
  }
  return (
    <li>
      {fullName} ({item.user.email}) - {item.description} {item.created_at}
    </li>
  )
}

const ProjectHistory = ({ project, mode }: ProjectHistoryProps) => {
  const renderedHistory = project.history.map((item) => (
    <HistoryItem key={item.created_at} item={item} />
  ))

  return (
    <div className="flex w-full flex-col gap-4">
      <ol reversed={true}>{renderedHistory}</ol>
    </div>
  )
}

export default ProjectHistory
