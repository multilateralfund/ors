import { useMemo, useRef, useState, useContext } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import {
  RedirectBackButton,
  CancelButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import ManagePCRsFiltersSelectedOpts from './ManagePCRsFiltersSelectedOpts'
import ManagePCRsFilters from './ManagePCRsFilters'
import ManagePCRsTable from './ManagePCRsTable'
import {
  initialFilters,
  categoryOpts,
  booleanFieldsOpts,
  borderedContainerClassname,
} from '../constants'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'
import { useStore } from '@ors/store'
import { api, formatApiUrl } from '@ors/helpers'

import { CircularProgress, Modal, Typography, Box } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { upperFirst, filter } from 'lodash'
import Link from '@ors/components/ui/Link/Link'
import ManagePCRDueTable from './ManagePCRDueTable'
import cx from 'classnames'

const ManagePCRsWrapper = () => {
  const form = useRef<any>()

  const { countries, agencies } = useContext(ProjectsDataContext)
  const projectsSlice = useStore((state) => state.projects)
  const statuses = filter(projectsSlice.statuses.data, (status) =>
    ['Completed', 'Financially completed'].includes(status.name),
  )

  const updatedInitialFiltersListing = {
    ...initialFilters,
    pcr_submitted: [booleanFieldsOpts[1]],
    pcr_due: [booleanFieldsOpts[1]],
  }
  const updatedInitialParamsListing = {
    ...initialFilters,
    pcr_submitted: ['No'],
    pcr_due: ['No'],
  }

  const updatedInitialParamsPcrDue = {
    ...initialFilters,
    pcr_submitted: ['No'],
    pcr_due: ['Yes'],
  }

  const [projectIds, setProjectIds] = useState<number[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'mark' | 'unmark'
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState(updatedInitialFiltersListing)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrProjects = useGetPCRProjects(updatedInitialParamsListing)
  const { loading, setParams, refetch } = pcrProjects

  const pcrDueProjects = useGetPCRProjects(updatedInitialParamsPcrDue)
  const { loading: loadingPcrDue, refetch: refetchPcrDue } = pcrDueProjects

  const fieldToActionMapping = {
    'mark_pcr-due': { action: 'mark as PCR due' },
    'unmark_pcr-due': { action: 'remove PCR due status' },
  }

  const fieldToOptionsMapping: Record<string, any[]> = {
    country: countries,
    lead_agency: agencies,
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

  const handleConfirm = async () => {
    if (!pendingAction) return

    if (pendingAction.type === 'mark') {
      await markProjects()
    } else {
      await unmarkProjects()
    }
  }

  const unmarkPcrDue = (ids: number[]) => {
    setPendingAction({ type: 'unmark' })
    setProjectIds(ids)
    setShowConfirmation(true)
  }

  const resetData = () => {
    setPendingAction(null)
    setShowConfirmation(false)
    setProjectIds([])
    refetch()
    refetchPcrDue()
  }

  const markProjects = async () => {
    setIsLoading(true)

    try {
      await api('api/pcr-metaprojects/set_pcr_or_ad_hoc/', {
        data: {
          meta_projects: projectIds,
          pcr_due: true,
        },
        method: 'POST',
      })

      enqueueSnackbar(<>Marked project(s) as PCR due.</>, {
        variant: 'success',
      })

      resetData()
    } catch (e) {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unmarkProjects = async () => {
    setIsLoading(true)

    try {
      await api('api/pcr-metaprojects/set_pcr_or_ad_hoc/', {
        data: {
          meta_projects: projectIds,
          pcr_due: false,
        },
        method: 'POST',
      })

      enqueueSnackbar(<>Removed PCR due status from project.</>, {
        variant: 'success',
      })

      resetData()
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
        active={loading || loadingPcrDue}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <RedirectBackButton />
            <PageHeading>Manage Project Completion Reports</PageHeading>
          </div>
          <div className="ml-auto mt-auto flex flex-wrap justify-end gap-2.5">
            <a
              className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedSecondary MuiButton-sizeLarge MuiButton-containedSizeLarge h-10 border border-solid border-primary bg-primary px-4 py-2 text-center text-[15px] font-medium text-mlfs-hlYellow no-underline shadow-none hover:border-primary hover:text-mlfs-hlYellow"
              href={formatApiUrl(
                '/admin/core/projectpcrrequiredexclusionrule/',
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              PCR exclusion rules
            </a>

            {showConfirmation && pendingAction && (
              <Modal
                aria-labelledby="manage-pcr-modal"
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
              >
                <Box className="flex w-full max-w-[90%] flex-col absolute-center md:max-w-xl">
                  <Typography className="mb-4 text-[20px] font-medium text-black">
                    {upperFirst(
                      fieldToActionMapping[`${pendingAction.type}_pcr-due`]
                        .action,
                    )}
                  </Typography>
                  <Typography className="mb-4 text-lg text-primary">
                    Are you sure you want to{' '}
                    {
                      fieldToActionMapping[`${pendingAction.type}_pcr-due`]
                        .action
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
                        fieldToActionMapping[`${pendingAction.type}_pcr-due`]
                          .action
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
        <div className="flex w-[calc(60%-20px)] flex-row justify-between">
          <div className="flex flex-col gap-2.5">
            <ManagePCRsFilters {...filtersProps} />
            <ManagePCRsFiltersSelectedOpts {...filtersProps} />
          </div>
          <SubmitButton
            title="Mark as PCR due"
            onSubmit={() => {
              setPendingAction({ type: 'mark' })
              setShowConfirmation(true)
            }}
            isDisabled={projectIds.length === 0}
            className="!mb-0"
          />
        </div>
        <div className="flex flex-row gap-10">
          <div
            className={cx(
              'w-[60%] rounded-lg bg-white',
              borderedContainerClassname,
            )}
          >
            <h2 className="pl-5">Completed projects</h2>
            <ManagePCRsTable
              {...{ pcrProjects, projectIds, setProjectIds, filters }}
            />
          </div>
          <div
            className={cx(
              'w-[40%] rounded-lg bg-white',
              borderedContainerClassname,
            )}
          >
            <h2 className="pl-5">PCR due</h2>
            <ManagePCRDueTable
              pcrProjects={pcrDueProjects}
              {...{ unmarkPcrDue }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default ManagePCRsWrapper
