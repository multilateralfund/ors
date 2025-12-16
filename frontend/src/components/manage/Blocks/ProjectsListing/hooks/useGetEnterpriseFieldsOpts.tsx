import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { EnterpriseOverview } from '../interfaces'
import { ProjectSectorType } from '@ors/types/api_project_sector'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector'
import { api } from '@ors/helpers'

import { debounce, find, sortBy } from 'lodash'

const useGetEnterpriseFieldsOpts = <T,>(
  enterpriseData: EnterpriseOverview,
  setEnterpriseData: Dispatch<SetStateAction<T>>,
  sectionIdentifier?: keyof T | null,
) => {
  const { sector, subsector } = enterpriseData

  const [sectors, setSectors] = useState<ProjectSectorType[]>([])
  const [subsectorsOpts, setSubsectorsOpts] = useState<ProjectSubSectorType[]>(
    [],
  )
  const subsectors = sortBy(subsectorsOpts, 'id')

  const fetchProjectSectors = async () => {
    try {
      const res = await api(
        'api/project-sector/',
        {
          params: { include_obsoletes: false },
          withStoreCache: true,
        },
        false,
      )
      setSectors(res || [])
    } catch (e) {
      console.error('Error at loading sectors')
      setSectors([])
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
          params: {
            sector_id: sector,
            include_obsoletes: false,
          },
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
    if (sector) {
      debouncedFetchProjectSubsectors()
    } else {
      setSubsectorsOpts([])
    }
  }, [sector])

  useEffect(() => {
    if (
      !sector ||
      (subsectors.length > 0 &&
        !find(subsectors, (crtSubsector) => subsector === crtSubsector.id))
    ) {
      setEnterpriseData((prev) => ({
        ...prev,
        ...(sectionIdentifier
          ? {
              [sectionIdentifier]: {
                ...prev[sectionIdentifier],
                subsector: null,
              },
            }
          : {
              subsector: null,
            }),
      }))
    }
  }, [JSON.stringify(subsectors), sector])

  return {
    sectors,
    subsectors,
  }
}

export default useGetEnterpriseFieldsOpts
