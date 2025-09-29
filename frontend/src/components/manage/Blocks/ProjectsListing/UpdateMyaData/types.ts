import {
  MetaProjectType,
  ProjectCluster,
  ProjectType,
} from '@ors/types/api_projects.ts'
import { initialFilters } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'
import { Country } from '@ors/types/store'
import { ApiAgency } from '@ors/types/api_agencies.ts'

export type MetaProjectFieldData = Record<
  string,
  { value: number | string | null; label: string; order: number }
>

export type MetaProjectDetailType = {
  projects: ProjectType[]
  field_data: MetaProjectFieldData
  computed_field_data: Record<string, number | string | null>
} & MetaProjectType

export type MetaProjectFiltersProps = {
  filters: typeof initialFilters
  countries: Country[]
  agencies: ApiAgency[]
  clusters: ProjectCluster[]
  handleFilterChange: (params: Record<string, any>) => void
  handleParamsChange: (params: Record<string, any>) => void
}

export type MetaProjectFiltersSelectedOptionsProps =
  {} & MetaProjectFiltersProps
