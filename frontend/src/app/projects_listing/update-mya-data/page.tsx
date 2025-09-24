import { useCallback, useContext, useEffect, useState } from 'react'

import { useStore } from '@ors/store'
import { formatApiUrl } from '@ors/helpers/Api/utils'
import { api, getResults } from '@ors/helpers'

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material'

import {
  MetaProjectType,
  ProjectCluster,
  ProjectType,
} from '@ors/types/api_projects.ts'
import useApi from '@ors/hooks/useApi'

import PListingTable from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PListingTable'
import { detailItem } from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ViewHelperComponents'

import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { DateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'

import dayjs from 'dayjs'
import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import { GridOptions } from 'ag-grid-community'
import Field from '@ors/components/manage/Form/Field.tsx'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import { map, union } from 'lodash'
import { Country } from '@ors/types/store'
import { IoChevronDown } from 'react-icons/io5'
import { ApiAgency } from '@ors/types/api_agencies.ts'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle.tsx'
import {
  displaySelectedOption,
  RedirectBackButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import {
  formatEntity,
  getAreFiltersApplied,
} from '@ors/components/manage/Blocks/ProjectsListing/utils.ts'

const MT_PER_PAGE = 10

const useGetMetaProjects = (
  params: typeof initialParams,
  withCache: boolean = false,
) => {
  const { data, ...rest } = useApi<MetaProjectType[]>({
    options: {
      withStoreCache: withCache,
      params: params,
    },
    path: 'api/meta-projects-for-mya-update/',
  })
  const results = getResults(data)

  return { ...rest, ...results }
}

type MetaProjectFieldData = Record<
  string,
  { value: number | string | null; label: string; order: number }
>

type MetaProjectDetailType = {
  projects: ProjectType[]
  field_data: MetaProjectFieldData
} & MetaProjectType

const useGetMetaProjectDetails = (pk?: number) => {
  const [data, setData] = useState<MetaProjectDetailType | null>(null)

  const fetchData = (pk: number) => {
    fetch(formatApiUrl(`/api/meta-projects/${pk}`), { credentials: 'include' })
      .then((resp) => resp.json())
      .then((data) => setData(data))
  }

  const refresh = useCallback(() => {
    if (pk) {
      fetchData(pk)
    }
  }, [pk])

  useEffect(() => {
    if (pk) {
      fetchData(pk)
    }
  }, [pk])

  return { data, refresh }
}

const orderFieldData = (fd: MetaProjectFieldData) => {
  const orderedFieldData = []

  for (const key of Object.keys(fd)) {
    orderedFieldData.push({ name: key, ...fd[key] })
  }
  orderedFieldData.sort((a, b) => a.order - b.order)

  return orderedFieldData
}

export type MetaProjectFiltersProps = {
  filters: typeof initialFilters
  countries: Country[]
  agencies: ApiAgency[]
  clusters: ProjectCluster[]
  handleFilterChange: (params: Record<string, any>) => void
  handleParamsChange: (params: Record<string, any>) => void
}

const MetaProjectFilters = (props: MetaProjectFiltersProps) => {
  const {
    filters,
    countries,
    agencies,
    clusters,
    handleFilterChange,
    handleParamsChange,
  } = props

  const defaultProps = {
    multiple: true,
    value: [],
    getOptionLabel: (option: any) => option?.name,
    FieldProps: { className: 'mb-0 w-full md:w-[7.76rem] BPList' },
    popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
    componentsProps: {
      popupIndicator: {
        sx: {
          transform: 'none !important',
        },
      },
    },
  }

  return (
    <div className="grid h-full grid-cols-2 flex-wrap items-center gap-x-2 gap-y-2 border-0 border-solid md:flex">
      <Field
        Input={{ placeholder: 'Country' }}
        options={getFilterOptions(filters, countries, 'country_id')}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const country = filters.country_id || []
          const newValue = union(country, value)

          handleFilterChange({ country_id: newValue })
          handleParamsChange({
            country_id: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
      <Field
        Input={{ placeholder: 'Lead agency' }}
        options={getFilterOptions(filters, agencies, 'lead_agency_id')}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const agency = filters.lead_agency_id || []
          const newValue = union(agency, value)

          handleFilterChange({ lead_agency_id: newValue })
          handleParamsChange({
            lead_agency_id: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
      <Field
        Input={{ placeholder: 'Cluster' }}
        options={getFilterOptions(filters, clusters, 'cluster_id')}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const cluster = filters.cluster_id || []
          const newValue = union(cluster, value)

          handleFilterChange({ cluster_id: newValue })
          handleParamsChange({
            cluster_id: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
    </div>
  )
}

export type MetaProjectFiltersSelectedOptionsProps =
  {} & MetaProjectFiltersProps

const MetaProjectFiltersSelectedOptions = (
  props: MetaProjectFiltersSelectedOptionsProps,
) => {
  const {
    countries,
    agencies,
    clusters,
    filters,
    handleFilterChange,
    handleParamsChange,
  } = props

  const areFiltersApplied = getAreFiltersApplied(filters)

  const filterSelectedOpts = [
    {
      entities: formatEntity(countries),
      entityIdentifier: 'country_id',
      hasPermissions: true,
    },
    {
      entities: formatEntity(agencies),
      entityIdentifier: 'lead_agency_id',
      hasPermissions: true,
    },
    {
      entities: formatEntity(clusters),
      entityIdentifier: 'cluster_id',
      hasPermissions: true,
    },
  ]

  return areFiltersApplied ? (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {map(
        filterSelectedOpts,
        (selectedOpt) =>
          selectedOpt.hasPermissions &&
          displaySelectedOption(
            filters,
            selectedOpt.entities,
            selectedOpt.entityIdentifier,
            handleFilterChange,
            handleParamsChange,
          ),
      )}

      <Typography
        className="cursor-pointer content-center text-lg font-medium"
        color="secondary"
        component="span"
        onClick={() => {
          handleParamsChange({ ...initialParams })
          handleFilterChange({ ...initialFilters })
        }}
      >
        Clear All
      </Typography>
    </div>
  ) : null
}
const MetaProjectView = (props: { mp: MetaProjectDetailType }) => {
  const { mp } = props

  const fieldData = orderFieldData(mp?.field_data ?? {})

  return (
    <div>
      {fieldData.map((fd) => (
        <div key={fd.name}>
          {detailItem(fd.label, fd?.value?.toString() ?? '-')}
        </div>
      ))}
    </div>
  )
}

const MetaProjectEdit = (props: {
  mp: MetaProjectDetailType
  refreshMetaProjectDetails: () => void
  onCancel: () => void
}) => {
  const { mp, refreshMetaProjectDetails, onCancel } = props

  const projects = getResults<ProjectType>(mp?.projects ?? [])

  const loadInitialState = useCallback(() => {
    const result = {} as Record<string, any>
    const fd = mp?.field_data ?? ({} as MetaProjectFieldData)

    for (const key of Object.keys(fd)) {
      result[key] = fd[key as keyof MetaProjectFieldData].value
    }

    return result
  }, [mp])

  const [form, setForm] = useState(loadInitialState)

  useEffect(() => {
    setForm(loadInitialState)
  }, [loadInitialState, mp])

  const fieldData = orderFieldData(mp?.field_data ?? {})

  const handleSave = async () => {
    const result = await api(`api/meta-projects/${mp.id}/`, {
      data: form,
      method: 'PUT',
    })
    refreshMetaProjectDetails()
  }

  const changeSimpleInput = useCallback(
    (name: string, opts?: { numeric?: boolean }) => {
      return (evt: any) => {
        setForm((prev) => {
          let newValue = evt.target.value || null
          if (opts?.numeric && isNaN(Number(newValue))) {
            newValue = prev[name]
          }
          return { ...prev, [name]: newValue }
        })
      }
    },
    [setForm],
  )

  const renderFieldData = (fieldData: any) => {
    return fieldData.map((fd: any) => (
      <div key={fd.name}>
        <Label htmlFor={fd.name}>{fd.label}</Label>
        {fd.type === 'DateTimeField' ? (
          <DateInput
            id={fd.name}
            className="BPListUpload !ml-0 h-10 w-40"
            value={form[fd.name] ?? ''}
            formatValue={(value) => dayjs(value).format('MM/DD/YYYY')}
            onChange={changeSimpleInput(fd.name)}
          />
        ) : null}
        {fd.type !== 'DateTimeField' ? (
          <SimpleInput
            id={fd.name}
            label=""
            type="text"
            value={form[fd.name] ?? ''}
            onChange={changeSimpleInput(fd.name, {
              numeric: fd.type === 'DecimalField',
            })}
          />
        ) : null}
      </div>
    ))
  }

  return (
    <Dialog open={!!mp?.id} onClose={onCancel} fullWidth={true} maxWidth={'xl'}>
      <DialogTitle>MYA: {mp?.new_code}</DialogTitle>
      <DialogContent>
        <Typography variant="h6">Projects</Typography>
        <PListingTable
          mode="listing"
          projects={projects as any}
          filters={{}}
          enablePagination={false}
        />
        <Typography variant="h6">Details</Typography>
        <div className="flex gap-2">
          <div className="flex-grow">
            {renderFieldData(
              fieldData.slice(0, Math.ceil(fieldData.length / 2)),
            )}
          </div>
          <div className="flex-grow">
            {renderFieldData(fieldData.slice(Math.ceil(fieldData.length / 2)))}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          className="hover:bg-white hover:text-primary"
          onClick={onCancel}
        >
          Close
        </Button>
        <Button
          className="bg-primary text-white hover:text-mlfs-hlYellow"
          onClick={handleSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const initialFilters = {
  country_id: [],
  lead_agency_id: [],
  cluster_id: [],
}

const initialParams = {
  country_id: [],
  lead_agency_id: [],
  cluster_id: [],
  limit: MT_PER_PAGE,
  offset: 0,
}

export default function ProjectsUpdateMyaDataPage() {
  usePageTitle('Projects - Update MYA data')

  const [filters, setFilters] = useState(() => initialFilters)

  const countries = useStore((state) => state.common.countries_for_listing.data)
  const agencies = useStore((state) => state.common.agencies.data)
  const clusters = useStore((state) => state.projects.clusters.data)

  const [selected, setSelected] = useState<MetaProjectType | null>(null)

  const { canViewProjects } = useContext(PermissionsContext)

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

  if (!canViewProjects) {
    return <NotFoundPage />
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
      field: 'cluster.code',
      tooltipField: 'cluster.name',
    },
  ]

  const handleParamsChange = (params: Record<string, any>) => {
    setParams(params)
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  return (
    <PageWrapper>
      <HeaderTitle>
        <div className="flex flex-col">
          <RedirectBackButton />
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <PageHeading className="min-w-fit">
              IA/BA Portal - Update MYA data
            </PageHeading>
          </div>
        </div>
      </HeaderTitle>

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
    </PageWrapper>
  )
}
