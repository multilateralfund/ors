import Table from '@ors/components/manage/Form/Table'
import { detailItem } from './ViewHelperComponents'

const ProjectSubmissionDetails = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {detailItem('Submission number', data.submission_number)}
        {detailItem('Submission category', data.submission_category)}
      </div>
      <span>Submission amounts</span>
      <Table
        className="mb-4"
        enablePagination={false}
        rowData={data.submission_amounts}
        suppressCellFocus={false}
        withSeparators={true}
        columnDefs={[
          {
            dataType: 'nubmer',
            field: 'amount',
            headerName: 'Amount',
            initialWidth: 140,
            minWidth: 140,
          },
          {
            dataType: 'number',
            field: 'impact',
            headerName: 'Impact',
            initialWidth: 120,
            minWidth: 120,
          },
          {
            field: 'cost_effectiveness',
            headerName: 'Cost effectivness',
            initialWidth: 140,
            minWidth: 140,
          },
          {
            field: 'status',
            headerName: 'Status',
            initialWidth: 140,
            minWidth: 140,
          },
        ]}
        getRowId={(props: any) => {
          return props.data.id
        }}
      />
      {detailItem(
        'Submission comments',
        data.submission_comments,
        'self-start',
      )}
    </div>
  )
}

export default ProjectSubmissionDetails
