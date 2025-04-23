'use client'

import Field from '@ors/components/manage/Form/Field'
import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import { debounce } from '@ors/helpers/Utils/Utils'
import useFocusOnCtrlF from '@ors/hooks/useFocusOnCtrlF'
import { tableColumns } from '../constants'

import { InputAdornment, IconButton as MuiIconButton } from '@mui/material'
import { IoChevronDown, IoSearchOutline } from 'react-icons/io5'
import { union } from 'lodash'

const ProjectsFilters = ({
  commonSlice,
  projectSlice,
  meetings,
  form,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const searchRef = useFocusOnCtrlF()

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
        name="search"
        defaultValue={filters.search}
        inputRef={searchRef}
        placeholder="Search by keyword..."
        FieldProps={{
          className: 'mb-0 w-full md:w-[14.375rem] BPList',
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MuiIconButton
                aria-label="search table"
                edge="start"
                tabIndex={-1}
                onClick={() => {
                  const search = form.current.search.value
                  handleParamsChange({
                    offset: 0,
                    search,
                  })
                  handleFilterChange({ search })
                }}
                disableRipple
              >
                <IoSearchOutline />
              </MuiIconButton>
            </InputAdornment>
          ),
        }}
        onKeyDown={() => {
          debounce(
            () => {
              const search = form.current.search.value
              handleParamsChange({
                offset: 0,
                search,
              })
              handleFilterChange({ search })
              if (searchRef.current) {
                searchRef.current.select()
              }
            },
            1000,
            'PFilterSearch',
          )
        }}
      />
      <Field
        Input={{ placeholder: tableColumns.country }}
        options={getFilterOptions(
          filters,
          commonSlice.countries.data,
          'country_id',
        )}
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
        Input={{ placeholder: tableColumns.agency }}
        options={getFilterOptions(
          filters,
          commonSlice.agencies.data,
          'agency_id',
        )}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const agency = filters.agency_id || []
          const newValue = union(agency, value)

          handleFilterChange({ agency_id: newValue })
          handleParamsChange({
            agency_id: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
      <Field
        Input={{ placeholder: tableColumns.cluster }}
        options={getFilterOptions(
          filters,
          projectSlice.clusters.data,
          'cluster_id',
        )}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const projectCluster = filters.cluster_id || []
          const newValue = union(projectCluster, value)

          handleFilterChange({ cluster_id: newValue })
          handleParamsChange({
            offset: 0,
            cluster_id: newValue.map((item: any) => item.id).join(','),
          })
        }}
        {...defaultProps}
      />
      <Field
        Input={{ placeholder: tableColumns.type }}
        options={getFilterOptions(
          filters,
          projectSlice.types.data,
          'project_type_id',
        )}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const projectType = filters.project_type_id || []
          const newValue = union(projectType, value)

          handleFilterChange({ project_type_id: newValue })
          handleParamsChange({
            offset: 0,
            project_type_id: newValue.map((item: any) => item.id).join(','),
          })
        }}
        {...defaultProps}
      />
      <Field
        Input={{ placeholder: tableColumns.sector }}
        options={getFilterOptions(
          filters,
          projectSlice.sectors.data,
          'sector_id',
        )}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const sector = filters.sector_id || []
          const newValue = union(sector, value)

          handleFilterChange({ sector_id: newValue })
          handleParamsChange({
            offset: 0,
            sector_id: newValue.map((item: any) => item.id).join(','),
          })
        }}
        {...defaultProps}
      />
      <div className="w-full md:w-[7.76rem]">
        <PopoverInput
          className="!m-0 mb-0 h-[2.25rem] min-h-[2.25rem] w-full truncate border-2 !py-1 !pr-0 text-[15px] md:w-[7.76rem]"
          label="Meeting"
          options={meetings}
          onChange={(value: any) => {
            const meetingId = filters.meeting_id || []
            const meetingValue = meetings.filter(
              (meeting: any) => meeting.value === value,
            )
            const newValue = union(meetingId, meetingValue)

            handleFilterChange({ meeting_id: newValue })
            handleParamsChange({
              offset: 0,
              meeting_id: newValue.map((item: any) => item.value).join(','),
            })
          }}
        />
      </div>
      <Field
        Input={{ placeholder: tableColumns.submission_status }}
        options={getFilterOptions(
          filters,
          projectSlice.submission_statuses.data,
          'submission_status_id',
        )}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const submissionStatus = filters.submission_status_id || []
          const newValue = union(submissionStatus, value)

          handleFilterChange({ submission_status_id: newValue })
          handleParamsChange({
            submission_status_id: newValue
              .map((item: any) => item.id)
              .join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
        FieldProps={{
          className: defaultProps.FieldProps.className + ' md:w-[10.3rem]',
        }}
      />
      <Field
        Input={{ placeholder: tableColumns.project_status }}
        options={getFilterOptions(
          filters,
          projectSlice.statuses.data,
          'status_id',
        )}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const projectStatus = filters.status_id || []
          const newValue = union(projectStatus, value)

          handleFilterChange({ status_id: newValue })
          handleParamsChange({
            offset: 0,
            status_id: newValue.map((item: any) => item.id).join(','),
          })
        }}
        {...defaultProps}
        FieldProps={{
          className: defaultProps.FieldProps.className + ' md:w-[9rem]',
        }}
      />
    </div>
  )
}

export default ProjectsFilters
