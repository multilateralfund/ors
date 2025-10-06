import { useContext, useMemo, useState } from 'react'

import { MetaProjectType } from '@ors/types/api_projects.ts'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import { GridOptions } from 'ag-grid-community'
import {
  initialFilters,
  initialParams,
  MT_PER_PAGE,
} from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'
import {
  useGetMetaProjectDetails,
  useGetMetaProjects,
} from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/hooks.ts'
import { MetaProjectEdit } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/MetaProjectEdit.tsx'
import { MetaProjectFilters } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/MetaProjectFilters.tsx'
import { MetaProjectFiltersSelectedOptions } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/MetaProjectFiltersSelectedOptions.tsx'
import useApi from '@ors/hooks/useApi.ts'

import { Box, Divider } from '@mui/material'
import { Redirect } from 'wouter'

export default function UpdateMyaData() {
  const [filters, setFilters] = useState(() => initialFilters)

  const countriesApi = useApi({
    options: {},
    path: 'api/meta-projects/countries',
  })
  const agenciesApi = useApi({
    options: {},
    path: 'api/meta-projects/lead-agencies',
  })
  const clustersApi = useApi({
    options: {},
    path: 'api/meta-projects/clusters',
  })

  const countries = useMemo(() => {
    if (countriesApi.loaded && countriesApi.data) {
      return countriesApi.data
    }
    return []
  }, [countriesApi.loaded, countriesApi.data])

  const agencies = useMemo(() => {
    if (agenciesApi.loaded && agenciesApi.data) {
      return agenciesApi.data
    }
    return []
  }, [agenciesApi.loaded, agenciesApi.data])

  const clusters = useMemo(() => {
    if (clustersApi.loaded && clustersApi.data) {
      return clustersApi.data
    }
    return []
  }, [clustersApi.loaded, clustersApi.data])

  const [selected, setSelected] = useState<MetaProjectType | null>(null)

  const { canViewProjects, canViewMetaProjects } =
    useContext(PermissionsContext)

  const { loaded, loading, results, count, setParams } =
    useGetMetaProjects(initialParams)

  const { data: metaproject, refresh: refreshMetaProjectDetails } =
    useGetMetaProjectDetails(selected?.id)

  const onToggleExpand = (mp: MetaProjectType) => {
    setSelected((prev) => {
      let newValue = null
      if (prev?.id !== mp.id) {
        newValue = mp
      }
      return newValue
    })
  }

  if (!(canViewProjects && canViewMetaProjects)) {
    return <Redirect to="/projects-listing" />
  }

  const columnDefs: GridOptions<MetaProjectType>['columnDefs'] = [
    {
      headerName: 'Code',
      field: 'new_code',
      tooltipField: 'new_code',
    },
    {
      headerName: 'Type',
      field: 'type',
      tooltipField: 'type',
    },
    {
      headerName: 'Country',
      field: 'country.name',
      tooltipField: 'country.name',
    },
    {
      headerName: 'Lead agency',
      field: 'lead_agency.name',
      tooltipField: 'lead_agency.name',
      valueGetter: (params) => {
        return params?.data?.lead_agency?.name ?? '-'
      },
    },
    {
      headerName: 'Cluster',
      sortable: false,
      valueGetter: (params) => {
        return params.data?.clusters.map((c) => c.name).join(', ')
      },
    },
  ]

  const handleParamsChange = (params: Record<string, any>) => {
    setParams(params)
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  return (
    <>
      <Box className="shadow-none">
        <MetaProjectFilters
          filters={filters}
          countries={countries}
          agencies={agencies}
          clusters={clusters}
          handleFilterChange={handleFilterChange}
          handleParamsChange={handleParamsChange}
        />
        <MetaProjectFiltersSelectedOptions
          filters={filters}
          countries={countries}
          agencies={agencies}
          clusters={clusters}
          handleFilterChange={handleFilterChange}
          handleParamsChange={handleParamsChange}
        />
        <Divider className="my-2" />
        <ViewTable<MetaProjectType>
          key={JSON.stringify(filters)}
          columnDefs={[...columnDefs]}
          defaultColDef={{
            headerClass: 'ag-text-center',
            cellClass: 'ag-text-center ag-cell-ellipsed',
            minWidth: 90,
            resizable: true,
            sortable: true,
          }}
          onRowClicked={(event) => onToggleExpand(event.data!)}
          domLayout="normal"
          enablePagination={true}
          alwaysShowHorizontalScroll={false}
          loaded={loaded}
          loading={loading}
          paginationPageSize={MT_PER_PAGE}
          paginationPageSizeSelector={[10, 20, 50, 80, 100].filter(
            (nr) => nr < count,
          )}
          resizeGridOnRowUpdate={true}
          rowCount={count}
          rowData={results}
          rowBuffer={120}
          rowsVisible={90}
          tooltipShowDelay={200}
          context={{ disableValidation: true }}
          components={{
            agColumnHeader: undefined,
            agTextCellRenderer: undefined,
          }}
          onPaginationChanged={({ page, rowsPerPage }) => {
            setParams({
              limit: rowsPerPage,
              offset: page * rowsPerPage,
            })
          }}
          onSortChanged={({ api }) => {
            const ordering = api
              .getColumnState()
              .filter((column) => !!column.sort)
              .map(
                (column) =>
                  (column.sort === 'asc' ? '' : '-') +
                  column.colId.replaceAll('.', '__'),
              )
              .join(',')
            setParams({ offset: 0, ordering })
          }}
        />
      </Box>
      {selected?.id && metaproject?.field_data ? (
        <MetaProjectEdit
          mp={metaproject}
          refreshMetaProjectDetails={refreshMetaProjectDetails}
          onCancel={() => setSelected(null)}
        />
      ) : null}
    </>
  )
}
