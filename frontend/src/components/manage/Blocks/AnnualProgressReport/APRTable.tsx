import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import getColumnDefs, {
  dataTypeDefinitions,
} from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'

interface AnnualProjectReport {
  // TODO
  meta_code: string
}

interface APRTableProps {
  projectReports: AnnualProjectReport[]
}

export default function APRTable({ projectReports }: APRTableProps) {
  const { columnDefs, defaultColDef } = getColumnDefs()

  return (
    <ViewTable
      dataTypeDefinitions={dataTypeDefinitions}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      rowData={projectReports}
      tooltipShowDelay={200}
    />
  )
}
