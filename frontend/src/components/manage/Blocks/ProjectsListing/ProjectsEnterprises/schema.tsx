const getColumnDefs = () => ({
  columnDefs: [
    {
      headerName: 'Code',
      field: 'code',
      tooltipField: 'code',
    },
    {
      headerName: 'Name',
      field: 'enterprise',
      tooltipField: 'enterprise',
      minWidth: 150,
    },
    {
      headerName: 'Status',
      field: 'status',
      tooltipField: 'status',
      minWidth: 120,
    },
    {
      headerName: 'Location',
      field: 'location',
      tooltipField: 'location',
    },
    {
      headerName: 'Application',
      field: 'application',
      tooltipField: 'application',
    },
  ],
  defaultColDef: {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed',
    minWidth: 90,
    resizable: true,
    sortable: true,
  },
})

export default getColumnDefs
