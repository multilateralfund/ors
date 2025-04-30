import { dateDetailItem } from './ViewHelperComponents'

const ProjectDate = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {dateDetailItem('Project start date', data.start_date)}
        {dateDetailItem('Project end date', data.end_date)}
      </div>
    </div>
  )
}

export default ProjectDate
