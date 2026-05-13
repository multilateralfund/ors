import { useContext } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { SearchFilter } from '../../HelperComponents'
import { enterpriseFieldsMapping } from '../constants'
import { OptionsType } from '../../interfaces'
import { getIsAgencyUser } from '../utils'
import { useStore } from '@ors/store'

import { IoChevronDown } from 'react-icons/io5'
import { union } from 'lodash'

const EnterprisesFilters = ({
  form,
  meetings,
  filters,
  handleFilterChange,
  handleParamsChange,
}: any) => {
  const { canViewOnlyOwnAgency } = useContext(PermissionsContext)

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const canFilterByAgency = !getIsAgencyUser(canViewOnlyOwnAgency, agency_id)

  const { countries, agencies, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)
  const { statuses } = useContext(EnterprisesDataContext)

  const defaultProps = {
    multiple: true,
    value: [],
    getOptionLabel: (option: any) => option?.name,
    FieldProps: { className: 'mb-0 w-[8.5rem] BPList' },
    popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
    componentsProps: {
      popupIndicator: {
        sx: {
          transform: 'none !important',
        },
      },
    },
  }

  const FieldFilter = ({
    field,
    options,
  }: {
    field: string
    options: OptionsType[]
  }) => {
    const filterField = field + '_id'

    return (
      <Field
        Input={{ placeholder: enterpriseFieldsMapping[field] }}
        options={getFilterOptions(filters, options, filterField)}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const filtervalue = filters[filterField] || []
          const newValue = union(filtervalue, value)

          handleFilterChange({ [filterField]: newValue })
          handleParamsChange({
            [filterField]: newValue.map((item: any) => item.id).join(','),
            offset: 0,
          })
        }}
        {...defaultProps}
      />
    )
  }

  return (
    <div className="flex h-full flex-wrap items-center gap-x-2 gap-y-2 border-0 border-solid">
      <SearchFilter
        placeholder="Search by keyword..."
        {...{ form, filters, handleFilterChange, handleParamsChange }}
      />
      <FieldFilter field="country" options={countries} />
      {canFilterByAgency && <FieldFilter field="agency" options={agencies} />}
      <div className="mb-0.5 w-[8.5rem]">
        <PopoverInput
          className="!m-0 h-9 border-2 !pr-0 !text-[16px] text-inherit"
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
      <FieldFilter field="project_type" options={project_types} />
      <FieldFilter field="sector" options={sectors} />
      <FieldFilter field="subsector" options={subsectors} />
      <FieldFilter field="status" options={statuses} />
    </div>
  )
}

export default EnterprisesFilters
