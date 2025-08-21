import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { ProjectData } from '../interfaces'
import { ProjectTypeType } from '@ors/types/api_project_types'
import { ProjectSectorType } from '@ors/types/api_project_sector'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector'
import { api } from '@ors/helpers'

import { debounce, filter, find } from 'lodash'

const useGetProjectFieldsOpts = (
  projectData: ProjectData,
  setProjectData: Dispatch<SetStateAction<ProjectData>>,
  mode: string,
) => {
  const sectionIdentifier = 'crossCuttingFields'
  const crossCuttingFields = projectData[sectionIdentifier]
  const { project_type, sector, subsector_ids } = crossCuttingFields
  const { cluster } = projectData.projIdentifiers

  const [projectTypesOpts, setProjectTypesOpts] = useState<ProjectTypeType[]>(
    [],
  )
  const crtProjectTypesOpts = filter(projectTypesOpts, (opt) => !opt.obsolete)
  const projectTypes = mode === 'edit' ? projectTypesOpts : crtProjectTypesOpts

  const [sectorsOpts, setSectorsOpts] = useState<ProjectSectorType[]>([])
  const crtSectorsOpts = filter(sectorsOpts, (opt) => !opt.obsolete)
  const sectors = mode === 'edit' ? sectorsOpts : crtSectorsOpts

  const [subsectorsOpts, setSubsectorsOpts] = useState<ProjectSubSectorType[]>(
    [],
  )
  const crtSubsectorsOpts = filter(subsectorsOpts, (opt) => !opt.obsolete)
  const subsectors = mode === 'edit' ? subsectorsOpts : crtSubsectorsOpts

  const fetchProjectTypes = async () => {
    try {
      const res = await api(
        'api/project-types/',
        {
          params: { cluster_id: cluster, include_obsoletes: true },
          withStoreCache: true,
        },
        false,
      )
      setProjectTypesOpts(res || [])
    } catch (e) {
      console.error('Error at loading project types')
      setProjectTypesOpts([])
    }
  }

  const debouncedFetchProjectTypes = debounce(fetchProjectTypes, 0)

  useEffect(() => {
    debouncedFetchProjectTypes()
  }, [cluster])

  const fetchProjectSectors = async () => {
    try {
      const res = await api(
        'api/project-sector/',
        {
          params: {
            cluster_id: cluster,
            type_id: project_type,
            include_obsoletes: true,
          },
          withStoreCache: true,
        },
        false,
      )
      setSectorsOpts(res || [])
    } catch (e) {
      console.error('Error at loading project sectors')
      setSectorsOpts([])
    }
  }

  const debouncedFetchProjectSectors = debounce(fetchProjectSectors, 0)

  useEffect(() => {
    if (project_type) {
      debouncedFetchProjectSectors()
    } else {
      setSectorsOpts([])
    }
  }, [cluster, project_type])

  const fetchProjectSubsectors = async () => {
    try {
      const res = await api(
        'api/project-subsector/',
        {
          params: {
            sector_id: sector,
            include_obsoletes: true,
          },
          withStoreCache: true,
        },
        false,
      )
      setSubsectorsOpts(res || [])
    } catch (e) {
      console.error('Error at loading project subsectors')
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
    if (projectTypes.length > 0) {
      if (!find(projectTypes, { id: project_type })) {
        setProjectData((prevData) => ({
          ...prevData,
          [sectionIdentifier]: {
            ...prevData[sectionIdentifier],
            project_type: null,
          },
        }))
      }
    }
  }, [JSON.stringify(projectTypes)])

  useEffect(() => {
    if (
      !project_type ||
      (sectors.length > 0 && !find(sectors, { id: sector }))
    ) {
      setProjectData((prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          sector: null,
        },
      }))
    }
  }, [JSON.stringify(sectors), project_type])

  useEffect(() => {
    if (
      !project_type ||
      !sector ||
      (subsectors.length > 0 &&
        !find(subsectors, (subsector) => subsector_ids.includes(subsector.id)))
    ) {
      setProjectData((prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          subsector_ids: [],
        },
      }))
    }
  }, [JSON.stringify(subsectors), project_type, sector])

  return {
    crtProjectTypesOpts,
    projectTypes,
    crtSectorsOpts,
    sectors,
    crtSubsectorsOpts,
    subsectors,
  }
}

export default useGetProjectFieldsOpts
