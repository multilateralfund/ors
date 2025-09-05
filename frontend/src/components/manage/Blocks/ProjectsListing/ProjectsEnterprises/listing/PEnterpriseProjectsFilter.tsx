import { useEffect, useMemo, useState } from 'react'

import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import TextWidget, {
  TextWidgetProps,
} from '@ors/components/manage/Widgets/TextWidget'
import { useGetProjects } from '../../hooks/useGetProjects'
import { ProjectType } from '@ors/types/api_projects'
import { useStore } from '@ors/store'

import { Autocomplete, CircularProgress } from '@mui/material'
import { debounce, find, uniqBy } from 'lodash'
import cx from 'classnames'

export interface WidgetProps {
  onChange: (_: any, value: any) => void
  filters: any
  Input?: TextWidgetProps
  FieldProps?: any
}

const PEnterpriseProjectsFilter = ({
  filters,
  Input,
  FieldProps,
  onChange,
  ...rest
}: WidgetProps) => {
  const projectSlice = useStore((state) => state.projects)
  const submissionStatuses = projectSlice.submission_statuses.data
  const approvedStatusId = find(
    submissionStatuses,
    (status) => status.name === 'Approved',
  )?.id

  const [projects, setProjects] = useState<ProjectType[]>([])

  const { results, loading, setParams } = useGetProjects(
    {
      submission_status_id: approvedStatusId,
      ordering: '-date_created',
      limit: 50,
      offset: 0,
    },
    true,
  )

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setParams({
          search: value || '',
          offset: 0,
        })
        setProjects([])
      }, 1000),
    [setParams],
  )

  useEffect(() => {
    if (results && results.length > 0) {
      setProjects((prev) => uniqBy([...prev, ...results], 'id'))
    }
  }, [results])

  return (
    <div className={cx(FieldProps?.className, 'md:w-[14rem]')}>
      <Autocomplete
        {...rest}
        options={getFilterOptions(filters, projects, 'project_id')}
        loading={loading}
        onChange={onChange}
        filterOptions={(x) => x}
        getOptionLabel={(option: ProjectType) =>
          option?.code ?? option?.code_legacy ?? ''
        }
        onInputChange={(_, newInputValue) => {
          if (!loading) {
            handleSearch(newInputValue)
          }
        }}
        ListboxProps={{
          onScroll: (event) => {
            const listboxNode = event.currentTarget
            const isNearBottom =
              listboxNode.scrollTop + listboxNode.clientHeight >=
              listboxNode.scrollHeight - 50

            if (isNearBottom && !loading) {
              setParams({
                offset: projects.length,
              })
            }
          },
        }}
        renderInput={(params) => (
          <TextWidget
            {...params}
            size="small"
            {...(Input || {})}
            InputProps={{
              ...params.InputProps,
              inputProps: {
                ...params.inputProps,
                readOnly: loading,
              },
              endAdornment: (
                <>
                  {loading && <CircularProgress size={16} className="mr-9" />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </div>
  )
}

export default PEnterpriseProjectsFilter
