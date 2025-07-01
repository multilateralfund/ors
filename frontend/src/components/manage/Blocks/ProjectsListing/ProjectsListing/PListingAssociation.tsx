'use client'

import { useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PListingFilters from './PListingFilters'
import PListingTable from './PListingTable'
import { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import { initialFilters } from '../constants'
import { PListingProps } from '../interfaces'

import { flatMap } from 'lodash'

export default function PListingAssociation({
  tableToolbar,
  ...rest
}: PListingProps) {
  const form = useRef<any>()

  const [filters, setFilters] = useState({ ...initialFilters })
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const projectsAssociation = useGetProjectsAssociation(initialFilters)
  const { loading, setParams, results = [] } = projectsAssociation

  const formattedResults = results.map((result) => {
    const formattedProjects = (result.projects || []).map(
      (project, index, arr) => ({
        ...project,
        isFirst: index === 0,
        isLast: index === arr.length - 1,
        isOnly: arr.length === 1,
      }),
    )

    return {
      ...result,
      projects: formattedProjects,
    }
  })
  const projects = {
    ...projectsAssociation,
    results: flatMap(formattedResults, (entry) => entry.projects || []),
  }

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
            {...{ form, filters, setFilters, setParams, initialFilters }}
          />
          {tableToolbar}
        </div>
        <PListingTable
          mode="association-listing"
          {...{ projects, filters }}
          {...rest}
        />
      </form>
    </>
  )
}
