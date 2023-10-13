import { useCallback, useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

const defaultColDef: any = {
  B_all_other_ods_date: {
    headerComponentParams: {
      footnote: 1,
      info: 'If Yes, since when (Date) / If No, planned date',
    },
    headerName: 'Date',
  },
  B_cfc_date: {
    headerComponentParams: {
      footnote: 1,
      info: 'If Yes, since when (Date) / If No, planned date',
    },
    headerName: 'Date',
  },
  B_hcfc_date: {
    headerComponentParams: {
      footnote: 1,
      info: 'If Yes, since when (Date) / If No, planned date',
    },
    headerName: 'Date',
  },
}

function useGridOptions(props: { adm_columns: any; model: string }) {
  const { adm_columns, model } = props
  const mapAdmColumn = useCallback((column: any) => {
    return {
      id: column.id,
      category: 'adm',
      headerName: column.display_name,
      type: column.type,
      ...(column.children.length
        ? {
            children: column.children.map(mapAdmColumn),
            headerGroupComponent: 'agColumnHeaderGroup',
            marryChildren: true,
          }
        : {}),
      ...(defaultColDef[column.full_name] || {}),
    }
  }, [])

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          children: [
            {
              cellClass: 'bg-mui-box-background',
              field: 'index',
              headerName: '',
              initialWidth: 100,
            },
            {
              cellClass: 'bg-mui-box-background',
              cellRendererParams: (props: any) => ({
                className: cx({
                  'font-bold':
                    props.data.level < 2 &&
                    includes(['title', 'subtitle'], props.data.type),
                  italic:
                    props.data.level < 2 && props.data.type === 'subtitle',
                }),
              }),
              field: 'text',
              flex: 1,
              headerName: '',
              minWidth: 700,
            },
          ],
          headerClass: 'ag-text-center',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'TYPE OF ACTION / LEGISLATION',
          marryChildren: true,
        },
        ...(adm_columns.length > 0 ? adm_columns.map(mapAdmColumn) : []),
        // {
        //   children: [
        //     {
        //       id: 17,
        //       category: 'adm',
        //       headerName: 'Yes/No',
        //       initialWidth: 150,
        //       type: 'boolean',
        //     },
        //     {
        //       id: 18,
        //       category: 'adm',
        //       headerComponentParams: {
        //         footnote: 1,
        //         info: 'If Yes, since when (Date) / If No, planned date',
        //       },
        //       headerName: 'Date',
        //       initialWidth: 200,
        //     },
        //   ],
        //   headerClass: 'ag-text-center',
        //   headerGroupComponent: 'agColumnHeaderGroup',
        //   headerName: 'HCFC',
        //   marryChildren: true,
        // },
        // ...(includes(['II'], model)
        //   ? [
        //       {
        //         children: [
        //           {
        //             id: 15,
        //             category: 'adm',
        //             headerName: 'Yes/No',
        //             initialWidth: 150,
        //             type: 'boolean',
        //           },
        //           {
        //             id: 16,
        //             category: 'adm',
        //             headerComponentParams: {
        //               footnote: 1,
        //               info: 'If Yes, since when (Date) / If No, planned date',
        //             },
        //             headerName: 'Date',
        //             initialWidth: 200,
        //           },
        //         ],
        //         headerClass: 'ag-text-center',
        //         headerGroupComponent: 'agColumnHeaderGroup',
        //         headerName: 'CFC',
        //         marryChildren: true,
        //       },
        //       {
        //         children: [
        //           {
        //             id: 14,
        //             category: 'adm',
        //             headerName: 'Yes/No',
        //             initialWidth: 150,
        //             type: 'boolean',
        //           },
        //           {
        //             id: 13,
        //             category: 'adm',
        //             headerComponentParams: {
        //               footnote: 1,
        //               info: 'If Yes, since when (Date) / If No, planned date',
        //             },
        //             headerName: 'Date',
        //             initialWidth: 200,
        //           },
        //         ],
        //         headerClass: 'ag-text-center',
        //         headerGroupComponent: 'agColumnHeaderGroup',
        //         headerName: 'All other ods',
        //         marryChildren: true,
        //       },
        //     ]
        //   : []),
        {
          field: 'remarks',
          headerName: 'Remarks',
          initialWidth: 300,
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: 'ag-text-center',
        headerClass: 'ag-text-center',
        minWidth: 100,
        resizable: true,
        wrapText: true,
      },
    }),
    // eslint-disable-next-line
    [model, adm_columns],
  )

  return gridOptions
}

export default useGridOptions
