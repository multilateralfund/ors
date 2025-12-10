import { Redirect, useParams } from 'wouter'
import usePageTitle from '@ors/hooks/usePageTitle.ts'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import React, { useContext, useState } from 'react'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import NotFoundPage from '@ors/app/not-found'
import { Box, Chip } from '@mui/material'
import { FiDownload, FiEdit, FiTable } from 'react-icons/fi'
import Button from '@mui/material/Button'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store.tsx'
import useGetColumnDefs, {
  dataTypeDefinitions,
} from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'
import UploadDocumentsModal from '@ors/components/manage/Blocks/AnnualProgressReport/UploadDocumentsModal.tsx'
import useApi from '@ors/hooks/useApi.ts'
import { union } from 'lodash'
import {
  INITIAL_PARAMS,
  MANDATORY_STATUSES,
} from '@ors/components/manage/Blocks/AnnualProgressReport/constants.ts'
import Loader from '@ors/components/manage/Blocks/AnnualProgressReport/Loader.tsx'
import Link from '@ors/components/ui/Link/Link.tsx'
import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import SubmitButton from '@ors/components/manage/Blocks/AnnualProgressReport/SubmitButton.tsx'
import {
  AnnualAgencyProjectReport,
  Filter,
} from '@ors/app/annual-project-report/types.ts'
import StatusFilter from '@ors/components/manage/Blocks/AnnualProgressReport/StatusFilter.tsx'

export default function APRWorkspace() {
  const [isUploadDocumentsModalOpen, setIsUploadDocumentsModalOpen] =
    useState(false)
  const { year } = useParams()
  usePageTitle(`Annual Progress Report (${year})`)
  const { canViewAPR, canSubmitAPR, canEditAPR, isMlfsUser } =
    useContext(PermissionsContext)
  const { data: user } = useStore((state) => state.user)
  const {
    statuses: { data: projectStatuses },
  } = useStore((state) => state.projects)
  const [filters, setFilters] =
    useState<Record<string, Filter[]>>(INITIAL_PARAMS)
  const {
    data: apr,
    loading,
    loaded,
    params,
    setParams,
    refetch,
  } = useApi<AnnualAgencyProjectReport>({
    options: {
      withStoreCache: false,
      triggerIf: canViewAPR,
    },
    path: `api/annual-project-report/${year}/workspace/`,
  })

  const { columnDefs, defaultColDef } = useGetColumnDefs()

  if (!canViewAPR) {
    return <NotFoundPage />
  }
  if (isMlfsUser) {
    return <Redirect to={`/${year}/mlfs/workspace`} replace />
  }

  const choosableStatuses = projectStatuses.filter(
    (status) => !MANDATORY_STATUSES.includes(status.code),
  )

  const onChipDelete =
    (filterKey: string, clearedObj: Filter, paramKey: keyof Filter = 'id') =>
    () => {
      const newFilters =
        filters[filterKey]?.filter((f) => f.id !== clearedObj.id) ?? []

      setFilters((oldFilters) => ({
        ...oldFilters,
        [filterKey]: newFilters,
      }))
      setParams({
        [filterKey]: newFilters.map((f) => f[paramKey]).join(','),
      })
    }

  const isDraft = apr?.status === 'draft' || apr?.is_unlocked
  const canUpdateAPR = canEditAPR && isDraft

  return (
    <PageWrapper>
      <div className="mb-2 flex justify-between">
        <PageHeading className="min-w-fit">{`Annual Progress Report (${year}) workspace`}</PageHeading>
        <div className="flex gap-x-2">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setIsUploadDocumentsModalOpen(true)}
          >
            Upload Documents
          </Button>
          {canSubmitAPR && user.agency_id && (
            <SubmitButton
              disabled={!isDraft || loading}
              revalidateData={refetch}
              year={year}
              agencyId={user.agency_id}
            />
          )}
        </div>
      </div>
      <Box className="shadow-none">
        <Loader active={loading} />
        <div className="mb-2 flex justify-between">
          <div className="flex flex-col">
            <StatusFilter
              disabled={loading}
              statusOptions={choosableStatuses}
              selectedCodes={filters.status.map((f) => f.code!)}
              onToggle={(status, checked) => {
                const statusFilters = checked
                  ? union(filters.status, [status])
                  : filters.status.filter((f) => f.code !== status.code)

                setFilters((oldFilters) => ({
                  ...oldFilters,
                  status: statusFilters,
                }))
                setParams({
                  status: statusFilters.map((f) => f.code).join(','),
                })
              }}
            />
            {Object.values(filters).some(
              (filterArr) => filterArr.length > 0,
            ) && (
              <ul className="m-0 flex list-none gap-x-2 px-0 py-2">
                {Object.entries(filters).flatMap(([filterKey, filterValue]) => {
                  const paramKey: keyof Filter =
                    filterKey === 'status' ? 'code' : 'id'
                  return filterValue.map((val) => (
                    <li key={val.id}>
                      <Chip
                        label={val.name}
                        onDelete={onChipDelete(filterKey, val, paramKey)}
                      />
                    </li>
                  ))
                })}
                <li>
                  <Button
                    variant="text"
                    onClick={() => {
                      setFilters(INITIAL_PARAMS)
                      setParams(INITIAL_PARAMS)
                    }}
                  >
                    Clear all
                  </Button>
                </li>
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-x-2">
            <Button
              variant="text"
              startIcon={<FiDownload size={18} />}
              href={formatApiUrl(
                `api/annual-project-report/${year}/agency/${user.agency_id}/export/`,
                params,
              )}
            >
              Export APR
            </Button>
            <Link
              button
              variant="text"
              startIcon={<FiEdit size={18} />}
              href={`/${year}/edit`}
              disabled={!canUpdateAPR}
            >
              Update APR
            </Link>
            <Button variant="text" startIcon={<FiTable size={18} />} disabled>
              Generate summary tables
            </Button>
          </div>
        </div>
        {loaded && (
          <ViewTable
            dataTypeDefinitions={dataTypeDefinitions}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowData={apr?.project_reports ?? []}
            tooltipShowDelay={200}
          />
        )}
      </Box>
      {isUploadDocumentsModalOpen && user.agency_id && (
        <UploadDocumentsModal
          isModalOpen={isUploadDocumentsModalOpen}
          setIsModalOpen={setIsUploadDocumentsModalOpen}
          year={year}
          agencyId={user.agency_id}
          oldFiles={apr?.files ?? []}
          revalidateFiles={refetch}
          disabled={!canUpdateAPR || loading}
        />
      )}
    </PageWrapper>
  )
}
