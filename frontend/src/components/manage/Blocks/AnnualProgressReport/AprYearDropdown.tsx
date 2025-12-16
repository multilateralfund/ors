import React, { useContext } from 'react'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect.tsx'
import { useAPRCurrentYear } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import { useLocation, useParams } from 'wouter'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'

export default function AprYearDropdown() {
  const { year } = useParams()
  const [, navigate] = useLocation()
  const { data, loading } = useAPRCurrentYear()
  const { isMlfsUser } = useContext(PermissionsContext)

  if (!data || loading) {
    return ''
  }

  const navigateToNewYear = ({ label }: { label: string }) => {
    const url = isMlfsUser ? `/${label}/mlfs/workspace` : `/${label}/workspace`
    navigate(url)
  }

  const initialIndex = data.apr_list.findIndex(
    (apr) => apr.year.toString() === year,
  )

  return (
    <SimpleSelect
      label=""
      initialIndex={initialIndex > 0 ? initialIndex : 0}
      onChange={navigateToNewYear}
      options={data.apr_list.map(({ year }) => ({
        label: year.toString(),
      }))}
    />
  )
}
