'use client'

import { useContext, useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PListingFilters from './PListingFilters'
import PListingTable from './PListingTable'
import { useGetProjects } from '../hooks/useGetProjects'
import { formatApiUrl } from '@ors/helpers'
import { initialFilters } from '../constants'
import Link from '@ors/components/ui/Link/Link'

export default function PExport() {
  const form = useRef<any>()

  const { canViewProjects } = useContext(PermissionsContext)

  const downloadUrlBase = '/api/projects/v2/export'

  const projects = useGetProjects(initialFilters)
  const { loading, params, setParams } = projects

  const [filters, setFilters] = useState<Record<string, any>>({
    ...initialFilters,
  })
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const downloadUrl = useMemo(() => {
    const encodedParams = new URLSearchParams(params).toString()
    return formatApiUrl(`${downloadUrlBase}?${encodedParams}`)
  }, [filters])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />

      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PListingFilters
            mode="listing"
            {...{ form, filters, initialFilters, setFilters, setParams }}
          />
          {canViewProjects && (
            <Link
              className="mb-auto px-4 py-2 text-lg uppercase md:mb-0.5"
              color="secondary"
              href={downloadUrl}
              variant="contained"
              button
              download
            >
              Generate DB
            </Link>
          )}
        </div>
        <PListingTable mode="listing" {...{ projects, filters }} />
      </form>
    </>
  )
}
