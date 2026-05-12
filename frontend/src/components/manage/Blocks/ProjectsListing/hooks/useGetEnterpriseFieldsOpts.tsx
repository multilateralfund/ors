import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { EnterpriseData } from '../interfaces'
import { ProjectSectorType } from '@ors/types/api_project_sector'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector'
import { api } from '@ors/helpers'

import { debounce, filter, find, sortBy } from 'lodash'

const useGetEnterpriseFieldsOpts = (
  enterpriseData: EnterpriseData,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseData>>,
  mode: string,
) => {
  const sectionIdentifier = 'overview'
  const { subsector } = enterpriseData[sectionIdentifier]

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
          params: {
            // sector_id: sector,
            include_obsoletes: true,
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

  // if we want a relation between sector and subsector

  // useEffect(() => {
  //   if (sector) {
  //     debouncedFetchProjectSubsectors()
  //   } else {
  //     setSubsectorsOpts([])
  //   }
  // }, [sector])

  useEffect(() => {
    debouncedFetchProjectSubsectors()
  }, [])

  useEffect(() => {
    if (
      // !sector ||
      subsectors.length > 0 &&
      !find(subsectors, (crtSubsector) => subsector === crtSubsector.id)
    ) {
      setEnterpriseData((prev) => ({
        ...prev,
        ...{
          [sectionIdentifier]: {
            ...prev[sectionIdentifier],
            subsector: null,
          },
        },
      }))
    }
  }, [JSON.stringify(subsectors)])
  // }, [JSON.stringify(subsectors), sector])

  return {
    sectors,
    subsectors,
  }
}

export default useGetEnterpriseFieldsOpts
