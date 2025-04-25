import Table from '@ors/components/manage/Form/Table'
import { numberDetailItem } from './ViewHelperComponents'

const ProjectFundingDetails = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {numberDetailItem('Total fund', data.total_fund)}
        {numberDetailItem('Total fund approved', data.total_fund_approved)}
        {numberDetailItem(
          'Total fund transferred',
          data.total_fund_transferred,
        )}
        {numberDetailItem('Funds allocated', data.funds_allocated)}
        {numberDetailItem('Funds disbursed', data.fund_disbursed)}
        {numberDetailItem('Funds disbursed PSC', data.fund_disbursed_psc)}
      </div>
      <span>Funds</span>
      <Table
        className="mb-4"
        enablePagination={false}
        rowData={data.funds}
        suppressCellFocus={false}
        withSeparators={true}
        columnDefs={[
          {
            field: 'fund_type',
            headerName: 'Type',
            initialWidth: 140,
            minWidth: 140,
          },
          {
            field: 'meeting',
            headerName: 'Meeting',
            initialWidth: 140,
            minWidth: 140,
          },
          {
            dataType: 'number',
            field: 'amount',
            headerName: 'Amount',
            initialWidth: 120,
            minWidth: 120,
          },
          {
            dataType: 'number',
            field: 'support_psc',
            headerName: 'Support PSC',
            initialWidth: 120,
            minWidth: 120,
          },
          {
            field: 'interest',
            headerName: 'Interest',
            initialWidth: 120,
            minWidth: 120,
          },
          {
            dataType: 'date',
            field: 'date',
            headerName: 'Date',
            initialWidth: 120,
            minWidth: 120,
          },
        ]}
        getRowId={(props: any) => {
          return props.data.id
        }}
      />
    </div>
  )
}

export default ProjectFundingDetails
