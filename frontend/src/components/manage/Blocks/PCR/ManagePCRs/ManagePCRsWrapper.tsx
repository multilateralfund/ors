import { useMemo, useRef, useState, useContext } from 'react'

import TableViewSelector from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableViewSelector'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import {
  RedirectBackButton,
  CancelButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
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
import { api } from '@ors/helpers'

import { CircularProgress, Modal, Typography, Box } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { upperFirst, filter } from 'lodash'

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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'mark' | 'unmark'
    status: 'pcr-due' | 'ad-hoc'
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState(updatedInitialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrProjects = useGetPCRProjects(updatedInitialParams)
  const { loading, setParams, refetch } = pcrProjects

  const fieldToActionMapping = {
    'mark_pcr-due': { action: 'mark as PCR due' },
    'mark_ad-hoc': { action: 'mark as ad-hoc PCR' },
    'unmark_pcr-due': { action: 'remove PCR due status' },
    'unmark_ad-hoc': { action: 'remove ad-hoc PCR status' },
  }

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

  const handleConfirm = async () => {
    if (!pendingAction) return

    if (pendingAction.type === 'mark') {
      await markProjects(pendingAction.status)
    } else {
      await unmarkProjects(pendingAction.status)
    }
  }

  const resetData = () => {
    setProjectIds({
      idsToAdd: [],
      idsToRemove: [],
    })
    setPendingAction(null)
    setShowConfirmation(false)
  }

  const markProjects = async (type: string) => {
    const message = `Marked project(s) as
      ${type === 'pcr-due' ? ' PCR due' : ' ad-hoc PCR'}.`
    const param = type === 'pcr-due' ? { pcr_due: true } : { ad_hoc_pcr: true }

    setIsLoading(true)

    try {
      await api('api/pcr-metaprojects/set_pcr_or_ad_hoc/', {
        data: {
          meta_projects: projectIds.idsToAdd,
          ...param,
        },
        method: 'POST',
      })

      enqueueSnackbar(<>{message}</>, {
        variant: 'success',
      })

      resetData()
      refetch()
    } catch (e) {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unmarkProjects = async (type: string) => {
    const message = `Removed
      ${type === 'pcr-due' ? ' PCR due' : ' ad-hoc PCR'} status from project(s).`
    const param =
      type === 'pcr-due' ? { pcr_due: false } : { ad_hoc_pcr: false }

    setIsLoading(true)

    try {
      await api('api/pcr-metaprojects/set_pcr_or_ad_hoc/', {
        data: {
          meta_projects: projectIds.idsToRemove,
          ...param,
        },
        method: 'POST',
      })

      enqueueSnackbar(<>{message}</>, {
        variant: 'success',
      })

      resetData()
      refetch()
    } catch (e) {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
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
                  onSubmit={() => {
                    setPendingAction({ type: 'mark', status: 'pcr-due' })
                    setShowConfirmation(true)
                  }}
                  isDisabled={projectIds.idsToAdd.length === 0}
                  className="!mb-0"
                />
                <SubmitButton
                  title="Mark as ad-hoc PCR"
                  onSubmit={() => {
                    setPendingAction({ type: 'mark', status: 'ad-hoc' })
                    setShowConfirmation(true)
                  }}
                  isDisabled={projectIds.idsToAdd.length === 0}
                  className="!mb-0"
                />
              </>
            ) : (
              <>
                <SubmitButton
                  title="Remove PCR due status"
                  onSubmit={() => {
                    setPendingAction({ type: 'unmark', status: 'pcr-due' })
                    setShowConfirmation(true)
                  }}
                  isDisabled={projectIds.idsToRemove.length === 0}
                  className="!mb-0"
                />
                <SubmitButton
                  title="Remove ad-hoc PCR status"
                  onSubmit={() => {
                    setPendingAction({ type: 'unmark', status: 'ad-hoc' })
                    setShowConfirmation(true)
                  }}
                  isDisabled={projectIds.idsToRemove.length === 0}
                  className="!mb-0"
                />
              </>
            )}
            {showConfirmation && pendingAction && (
              <Modal
                aria-labelledby="manage-pcr-modal"
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
              >
                <Box className="flex w-full max-w-[90%] flex-col absolute-center md:max-w-xl">
                  <Typography className="mb-4 text-[20px] font-medium text-black">
                    {upperFirst(
                      fieldToActionMapping[
                        `${pendingAction.type}_${pendingAction.status}`
                      ].action,
                    )}
                  </Typography>
                  <Typography className="mb-4 text-lg text-primary">
                    Are you sure you want to{' '}
                    {
                      fieldToActionMapping[
                        `${pendingAction.type}_${pendingAction.status}`
                      ].action
                    }{' '}
                    {pendingAction.type === 'unmark' && 'from'} the selected
                    project(s)?
                  </Typography>
                  <div className="mr-3 flex flex-wrap justify-end gap-3">
                    <CustomLink
                      className="h-10 px-4 py-2 text-lg uppercase"
                      onClick={handleConfirm}
                      href={null}
                      color="secondary"
                      variant="contained"
                      button
                    >
                      {
                        fieldToActionMapping[
                          `${pendingAction.type}_${pendingAction.status}`
                        ].action
                      }
                    </CustomLink>
                    <CancelButton onClick={() => setShowConfirmation(false)} />
                    {isLoading && (
                      <CircularProgress
                        color="inherit"
                        size="30px"
                        className="text-align mb-1 ml-1.5 mt-auto"
                      />
                    )}
                  </div>
                </Box>
              </Modal>
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
