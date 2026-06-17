import { useState, useEffect } from 'react'

import { ProjectSectorType } from '@ors/types/api_project_sector'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector'
import { api } from '@ors/helpers'

import { debounce, filter, sortBy } from 'lodash'

const useGetEnterpriseFieldsOpts = (mode: string) => {
  const [sectorsOpts, setSectorsOpts] = useState<ProjectSectorType[]>([])
  const crtSectorsOpts = filter(sectorsOpts, (opt) => !opt.obsolete)
  const sectors = mode === 'edit' ? sectorsOpts : crtSectorsOpts

  const [subsectorsOpts, setSubsectorsOpts] = useState<ProjectSubSectorType[]>(
    [],
  )
  const crtSubsectorsOpts = filter(subsectorsOpts, (opt) => !opt.obsolete)
  const unsortedSsubsectors =
    mode === 'edit' ? subsectorsOpts : crtSubsectorsOpts
  const subsectors = sortBy(unsortedSsubsectors, 'id')

  const fetchProjectSectors = async () => {
    try {
      const res = await api(
        'api/project-sector/',
        {
          params: { include_obsoletes: true },
          withStoreCache: true,
        },
        false,
      )
      setSectorsOpts(res || [])
    } catch (e) {
      console.error('Error at loading sectors')
      setSectorsOpts([])
    }
  }

  const debouncedFetchProjectSectors = debounce(fetchProjectSectors, 0)

  useEffect(() => {
    debouncedFetchProjectSectors()
  }, [])

  const fetchProjectSubsectors = async () => {
    try {
      const res = await api(
        'api/project-subsector/',
        {
          params: { include_obsoletes: true },
          withStoreCache: true,
        },
        false,
      )
      setSubsectorsOpts(res || [])
    } catch (e) {
      console.error('Error at loading subsectors')
      setSubsectorsOpts([])
    }
  }

  const debouncedFetchProjectSubsectors = debounce(fetchProjectSubsectors, 0)

  useEffect(() => {
    debouncedFetchProjectSubsectors()
  }, [])

  return { sectors, subsectors }
}

export default useGetEnterpriseFieldsOpts
