import Field from '@ors/components/manage/Form/Field'
import { debounce } from '@ors/helpers'

import { IoChevronDownCircle } from 'react-icons/io5'

const StatusFilter = (props: {
  filters: any
  setFilters: any
  statuses: any
}) => {
  const { filters, setFilters, statuses } = props

  // Map statuses to an array of objects with label and value
  const statusOptions = statuses.map((status: any) => ({
    label: status[1],
    value: status[0],
  }))

  return (
    <Field<any>
      FieldProps={{ className: 'mb-0 w-40 BPList' }}
      options={statusOptions}
      popupIcon={<IoChevronDownCircle color="black" size={24} />}
      widget="autocomplete"
      Input={{
        placeholder: 'Status',
      }}
      getOptionLabel={(option: { label: string; value: string }) =>
        option.label
      }
      value={
        statusOptions.find((option: any) => option.value === filters.status) ||
        null
      }
      onChange={(_: any, value: any) => {
        debounce(() => {
          setFilters({ ...filters, status: value ? value.value : null })
        })
      }}
    />
  )
}

const AgencyFilter = (props: {
  agencies: any
  filters: any
  setFilters: any
}) => {
  const { agencies, filters, setFilters } = props

  const agencyOptions = agencies.map((agency: any) => ({
    id: agency.id,
    label: agency.name,
  }))

  return (
    <Field<any>
      FieldProps={{ className: 'mb-0 w-40 BPList' }}
      getOptionLabel={(option: { id: number; label: string }) => option.label}
      options={agencyOptions}
      popupIcon={<IoChevronDownCircle color="black" size={24} />}
      widget="autocomplete"
      Input={{
        placeholder: 'Agency',
      }}
      value={
        agencyOptions.find((option: any) => option.id === filters.agency_id) ||
        null
      }
      onChange={(_: any, value: any) => {
        debounce(() => {
          setFilters({ ...filters, agency_id: value ? value.id : null })
        })
      }}
    />
  )
}

function BPListFilters(props: any) {
  const { agencies, filters, setFilters, statuses } = props

  return (
    <div id="filters" className="flex h-fit gap-4">
      <AgencyFilter
        agencies={agencies}
        filters={filters}
        setFilters={setFilters}
      />
      <StatusFilter
        filters={filters}
        setFilters={setFilters}
        statuses={statuses}
      />
    </div>
  )
}

export { BPListFilters }
