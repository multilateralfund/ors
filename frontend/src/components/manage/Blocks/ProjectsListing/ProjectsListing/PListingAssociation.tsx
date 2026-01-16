'use client'

import { useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PListingFilters from './PListingFilters'
import PListingTable from './PListingTable'
import { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import { useGetProjectFilters } from '../hooks/useGetProjectFilters'
import { PListingProps, ProjectTypeApi } from '../interfaces'
import { initialFilters } from '../constants'

import { flatMap, sumBy } from 'lodash'

export default function PListingAssociation({
  tableToolbar,
  ...rest
}: PListingProps) {
  const form = useRef<any>()

  const updatedInitialFilters = { ...initialFilters, limit: 50 }
  const [filters, setFilters] = useState(updatedInitialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const projectFilters = useGetProjectFilters({
    ...filters,
    meta_project__isnull: false,
  })
  const projectsAssociation = useGetProjectsAssociation(updatedInitialFilters)
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
    results: flatMap(formattedResults, (entry) => [
      {
        title: 'Metaproject: ' + (entry.umbrella_code ?? 'N/A'),
        isMetaproject: true,
        total_fund: sumBy(entry.projects, 'total_fund') || undefined,
        support_cost_psc:
          sumBy(entry.projects, 'support_cost_psc') || undefined,
      } as any as ProjectTypeApi,
      ...(entry.projects || []),
    ]),
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
            {...{
              form,
              filters,
              setFilters,
              setParams,
              initialFilters,
              projectFilters,
            }}
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
