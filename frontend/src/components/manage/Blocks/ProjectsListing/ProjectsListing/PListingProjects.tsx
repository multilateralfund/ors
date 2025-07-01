'use client'

import { useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PListingFilters from './PListingFilters'
import PListingTable from './PListingTable'
import { useGetProjects } from '../hooks/useGetProjects'
import { initialFilters } from '../constants'
import { PListingProps } from '../interfaces'

export default function PListingProjects({
  tableToolbar,
  ...rest
}: PListingProps) {
  const form = useRef<any>()

  const [filters, setFilters] = useState({ ...initialFilters })
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const projects = useGetProjects(initialFilters)
  const { loading, setParams } = projects

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
          <PListingFilters
            mode="listing"
            {...{ form, filters, initialFilters, setFilters, setParams }}
          />
          {tableToolbar}
        </div>
        <PListingTable mode="listing" {...{ projects, filters }} {...rest} />
      </form>
    </>
  )
}
