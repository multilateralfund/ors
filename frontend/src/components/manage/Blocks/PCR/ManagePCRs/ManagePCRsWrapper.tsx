import { useMemo, useRef, useState, useContext } from 'react'

import TableViewSelector from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableViewSelector'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import ManagePCRsFiltersSelectedOpts from './ManagePCRsFiltersSelectedOpts'
import ManagePCRsFilters from './ManagePCRsFilters'
import ManagePCRsTable from './ManagePCRsTable'
import { initialFilters, categoryOpts, booleanFieldsOpts } from '../constants'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'
import { useStore } from '@ors/store'

import { enqueueSnackbar } from 'notistack'
import { filter } from 'lodash'

const ManagePCRsWrapper = () => {
  const form = useRef<any>()

  const { countries, agencies, clusters, project_types, sectors } =
    useContext(ProjectsDataContext)
  const projectsSlice = useStore((state) => state.projects)
  const statuses = filter(projectsSlice.statuses.data, (status) =>
    ['Completed', 'Financially completed'].includes(status.name),
  )

  const updatedInitialFilters = {
    ...initialFilters,
    pcr_submitted: [booleanFieldsOpts[1]],
    pcr_due: [booleanFieldsOpts[1]],
    ad_hoc_pcr: [booleanFieldsOpts[1]],
  }
  const updatedInitialParams = {
    ...initialFilters,
    pcr_submitted: ['No'],
    pcr_due: ['No'],
    ad_hoc_pcr: ['No'],
  }

  const [view, setView] = useState<ViewSelectorValuesType | null>('list')
  const [projectIds, setProjectIds] = useState<Record<string, number[]>>({
    idsToAdd: [],
    idsToRemove: [],
  })
  const [filters, setFilters] = useState(updatedInitialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrProjects = useGetPCRProjects(updatedInitialParams)
  const { loading, setParams } = pcrProjects

  const fieldToOptionsMapping: Record<string, any[]> = {
    country: countries,
    lead_agency: agencies,
    cluster: clusters,
    project_type: project_types,
    sector: sectors,
    category: categoryOpts,
    status: statuses,
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
  }

  const filtersProps = {
    form,
    filters,
    fieldToOptionsMapping,
    handleFilterChange,
    handleParamsChange,
  }

  const handleChangeViewSelector = (value: ViewSelectorValuesType) => {
    setView(value)

    const pcrDue =
      value === 'table' ? booleanFieldsOpts[0] : booleanFieldsOpts[1]
    const adHocPcr = value === 'list' ? booleanFieldsOpts[1] : null

    handleFilterChange({
      pcr_due: [pcrDue],
      ad_hoc_pcr: adHocPcr ? [adHocPcr] : null,
    })
    handleParamsChange({
      pcr_due: pcrDue.id,
      ad_hoc_pcr: adHocPcr ? adHocPcr.id : null,
      offset: 0,
    })
  }

  const markAsPcrDue = () => {
    enqueueSnackbar(<>Marked project(s) as PCR due.</>, {
      variant: 'success',
    })
  }

  const markAsAdHocPcr = () => {
    enqueueSnackbar(<>Marked project(s) as ad-hoc PCR.</>, {
      variant: 'success',
    })
  }

  const removePcrDue = () => {
    enqueueSnackbar(<>Removed PCR due status of project(s).</>, {
      variant: 'success',
    })
  }

  const removeAdHocPcr = () => {
    enqueueSnackbar(<>Removed ad-hoc PCR status of project(s).</>, {
      variant: 'success',
    })
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <RedirectBackButton />
            <PageHeading>Manage Project Completion Reports</PageHeading>
          </div>
          <div className="ml-auto mt-auto flex flex-wrap justify-end gap-2.5">
            {view === 'list' ? (
              <>
                <SubmitButton
                  title="Mark as PCR due"
                  onSubmit={markAsPcrDue}
                  isDisabled={projectIds.idsToAdd.length === 0}
                  className="!mb-0"
                />
                <SubmitButton
                  title="Mark as ad-hoc PCR"
                  onSubmit={markAsAdHocPcr}
                  isDisabled={projectIds.idsToAdd.length === 0}
                  className="!mb-0"
                />
              </>
            ) : (
              <>
                <SubmitButton
                  title="Remove PCR due status"
                  onSubmit={removePcrDue}
                  isDisabled={projectIds.idsToRemove.length === 0}
                  className="!mb-0"
                />
                <SubmitButton
                  title="Remove ad-hoc PCR status"
                  onSubmit={removeAdHocPcr}
                  isDisabled={projectIds.idsToRemove.length === 0}
                  className="!mb-0"
                />
              </>
            )}
          </div>
        </div>
      </HeaderTitle>
      <div className="flex flex-col gap-6" key={key}>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-4 md:flex-row">
            <ManagePCRsFilters {...filtersProps} />
            <TableViewSelector
              value={view as ViewSelectorValuesType}
              reverseViewOrder={true}
              tooltipText={['All projects', 'PCR due']}
              changeHandler={(_, value) => {
                if (value) {
                  handleChangeViewSelector(value)
                }
              }}
            />
          </div>
          <ManagePCRsFiltersSelectedOpts {...filtersProps} />
        </div>
        <ManagePCRsTable
          {...{ pcrProjects, projectIds, setProjectIds, filters, view }}
        />
      </div>
    </>
  )
}

export default ManagePCRsWrapper
