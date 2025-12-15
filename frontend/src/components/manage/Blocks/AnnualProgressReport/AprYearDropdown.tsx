import React, { useContext } from 'react'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect.tsx'
import { useAPRCurrentYear } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import { useLocation } from 'wouter'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'

export default function AprYearDropdown() {
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

  return (
    <SimpleSelect
      label=""
      onChange={navigateToNewYear}
      options={data.apr_list.map(({ year }) => ({
        label: year.toString(),
      }))}
    />
  )
}
