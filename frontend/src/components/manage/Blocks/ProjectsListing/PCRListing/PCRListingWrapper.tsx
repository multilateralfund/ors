'use client'

import { useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PCRListingFilters from './PCRListingFilters'
import PCRTable from './PCRTable'
import { useGetPCRProjectFilters } from './hooks/useGetPCRProjectFilters'
import { useGetPCRProjects } from './hooks/useGetPCRProjects'
import { pcrInitialFilters } from './constants'

export default function PCRListingWrapper() {
  const form = useRef<any>()

  const [filters, setFilters] = useState({ ...pcrInitialFilters })
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrFilters = useGetPCRProjectFilters(filters)
  const projects = useGetPCRProjects(pcrInitialFilters)
  const { loading, setParams } = projects

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
          <PCRListingFilters
            {...{
              form,
              filters,
              setFilters,
              setParams,
              pcrFilters,
            }}
          />
        </div>
        <PCRTable {...{ projects, filters }} />
      </form>
    </>
  )
}
