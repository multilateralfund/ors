import Table from '@ors/components/manage/Form/Table'
import { detailItem, numberDetailItem } from './ViewHelperComponents'

const ProjectSubstanceDetails = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {detailItem('Substance name', data.substance_name)}
        {detailItem('Substance category', data.substance_category)}
        {detailItem('Substance type', data.substance_type)}
        {numberDetailItem('Substance phasedout', data.substance_phasedout)}
        {numberDetailItem('HCFC stage', data.hcfc_stage)}
      </div>
      <span>ODS ODP</span>
      <Table
        className="mb-4"
        enablePagination={false}
        rowData={data.ods_odp}
        suppressCellFocus={false}
        withSeparators={true}
        columnDefs={[
          {
            field: 'ods_display_name',
            headerName: 'Substance',
            initialWidth: 140,
            minWidth: 140,
          },
          {
            field: 'ods_replacement',
            headerName: 'Replacement',
            initialWidth: 120,
            minWidth: 120,
          },
          {
            dataType: 'number',
            field: 'odp',
            headerName: 'ODP',
            initialWidth: 120,
            minWidth: 120,
          },
          {
            dataType: 'number',
            field: 'co2_mt',
            headerName: 'CO₂MT',
            initialWidth: 120,
            minWidth: 120,
          },
          {
            field: 'ods_type',
            headerName: 'ODS type',
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

export default ProjectSubstanceDetails
