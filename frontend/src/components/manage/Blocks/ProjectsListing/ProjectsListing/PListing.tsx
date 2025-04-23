'use client'

import { useMemo, useRef, useState } from 'react'

import PListingFilters from './PListingFilters'
import PListingTable from './PListingTable'
import Loading from '@ors/components/theme/Loading/Loading'

import { useGetProjects } from '../hooks/useGetProjects'

const PROJECTS_PER_PAGE = 25

export default function PListing() {
  const form = useRef<any>()

  const initialFilters = {
    offset: 0,
    limit: PROJECTS_PER_PAGE,
  }

  const projects = useGetProjects(initialFilters)
  const { loading, setParams } = projects

  const [filters, setFilters] = useState({ ...initialFilters })

  const key = useMemo(() => JSON.stringify(filters), [filters])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <form className="flex flex-col gap-6" ref={form}>
        <PListingFilters
          {...{ form, filters, initialFilters, setFilters, setParams }}
        />
        <PListingTable key={key} {...{ projects, PROJECTS_PER_PAGE }} />
      </form>
    </>
  )
}
