import { useParams } from 'wouter'
import usePageTitle from '@ors/hooks/usePageTitle.ts'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import { useContext, useState } from 'react'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import NotFoundPage from '@ors/app/not-found'
import APRTable from '@ors/components/manage/Blocks/AnnualProgressReport/APRTable.tsx'
import { Box, Chip } from '@mui/material'
import { FiTable, FiEdit, FiDownload } from 'react-icons/fi'
import Button from '@mui/material/Button'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store.tsx'
import Field from '@ors/components/manage/Form/Field.tsx'
import { tableColumns } from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'
import { IoChevronDown } from 'react-icons/io5'
import UploadDocumentsModal from '@ors/components/manage/Blocks/AnnualProgressReport/UploadDocumentsModal.tsx'
import useApi from '@ors/hooks/useApi.ts'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import { union } from 'lodash'
import {
  INITIAL_PARAMS,
  MANDATORY_STATUSES,
} from '@ors/components/manage/Blocks/AnnualProgressReport/constants.ts'
import Loader from '@ors/components/manage/Blocks/AnnualProgressReport/Loader.tsx'

interface Filter {
  id: string
  name: string
  code?: string
}

export default function APRWorkspace() {
  const [isUploadDocumentsModalOpen, setIsUploadDocumentsModalOpen] =
    useState(false)
  const { year } = useParams()
  usePageTitle(`Annual Progress Report (${year})`)
  const { canViewAPR } = useContext(PermissionsContext)
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
    setParams,
  } = useApi({
    options: {
      withStoreCache: false,
    },
    path: `api/annual-project-report/${year}/workspace/`,
  })

  if (!canViewAPR) {
    return <NotFoundPage />
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

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">{`Annual Progress Report (${year}) workspace`}</PageHeading>
      <Box className="shadow-none">
        <div className="mb-2 flex items-end justify-between">
          <div className="flex flex-col gap-x-2">
            <Field
              Input={{ placeholder: tableColumns.status.label }}
              options={getFilterOptions(filters, choosableStatuses, 'status')}
              widget="autocomplete"
              multiple={true}
              value={[]}
              getOptionLabel={(option: any) => option?.name}
              popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
              FieldProps={{ className: 'mb-0 md:w-32 BPList' }}
              componentsProps={{
                popupIndicator: {
                  sx: {
                    transform: 'none !important',
                  },
                },
              }}
              onChange={(_: any, value: any) => {
                const statusFilters = union(filters.status, value)

                setFilters((oldFilters) => ({
                  ...oldFilters,
                  status: statusFilters,
                }))
                setParams({
                  status: statusFilters.map((v: any) => v.code).join(','),
                })
              }}
            />
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
              {Object.values(filters).some(
                (filterArr) => filterArr.length > 0,
              ) && (
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
              )}
            </ul>
          </div>

          <div className="flex flex-col items-end gap-y-2">
            <Button
              variant="contained"
              disabled
              onClick={() => setIsUploadDocumentsModalOpen(true)}
            >
              Upload Documents
            </Button>
            <div className="flex flex-wrap gap-x-2">
              <Button
                variant="text"
                startIcon={<FiDownload size={18} />}
                href={formatApiUrl(
                  `api/annual-project-report/${year}/agency/${user.agency_id}/export/`,
                )}
              >
                Export APR
              </Button>
              <Button variant="text" startIcon={<FiEdit size={18} />} disabled>
                Update APR
              </Button>
              <Button variant="text" startIcon={<FiTable size={18} />} disabled>
                Generate summary tables
              </Button>
            </div>
          </div>
        </div>
        <Loader active={loading} />
        {loaded && <APRTable projectReports={apr.project_reports} />}
      </Box>
      {isUploadDocumentsModalOpen && (
        <UploadDocumentsModal
          isModalOpen={isUploadDocumentsModalOpen}
          setIsModalOpen={setIsUploadDocumentsModalOpen}
        />
      )}
    </PageWrapper>
  )
}
