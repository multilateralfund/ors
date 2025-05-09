import { useEffect, useState, ChangeEvent } from 'react'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { DateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { ProjectTypeType } from '@ors/types/api_project_types.ts'
import { ProjectSectorType } from '@ors/types/api_project_sector.ts'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector.ts'
import {
  tableColumns,
  lvcNonLvcOpts,
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
} from '../constants'
import { CrossCuttingFields, ProjIdentifiers } from '../interfaces'
import { isOptionEqualToValueByValue } from '../utils'
import { useStore } from '@ors/store'
import { api } from '@ors/helpers'

import { Checkbox, TextareaAutosize } from '@mui/material'
import { debounce, filter, find, includes, isNil } from 'lodash'
import dayjs from 'dayjs'

export type BooleanFieldType = {
  name: string
  value: boolean
}

const ProjectCrossCuttingFields = ({
  projIdentifiers,
  crossCuttingFields,
  setCrossCuttingFields,
}: {
  projIdentifiers: ProjIdentifiers
  crossCuttingFields: CrossCuttingFields
  setCrossCuttingFields: React.Dispatch<
    React.SetStateAction<CrossCuttingFields>
  >
}) => {
  const projectSlice = useStore((state) => state.projects)
  const subsectors = projectSlice.subsectors.data

  const [projectTypesOpts, setProjectTypesOpts] = useState([])
  const [sectorsOpts, setSectorsOpts] = useState([])

  const fetchProjectTypes = async () => {
    try {
      const res = await api(
        'api/project-types/',
        {
          params: { cluster_id: projIdentifiers.cluster },
          withStoreCache: true,
        },
        false,
      )
      setProjectTypesOpts(res || [])
    } catch (e) {
      console.error('Error at loading project types')
    }
  }

  const debouncedFetchProjectTypes = debounce(fetchProjectTypes, 0)

  useEffect(() => {
    debouncedFetchProjectTypes()
  }, [projIdentifiers.cluster])

  const fetchProjectSectors = async () => {
    try {
      const res = await api(
        'api/project-sector/',
        {
          params: {
            cluster_id: projIdentifiers.cluster,
            type_id: crossCuttingFields.project_type,
          },
          withStoreCache: true,
        },
        false,
      )
      setSectorsOpts(res || [])
    } catch (e) {
      console.error('Error at loading project sectors')
    }
  }

  const debouncedFetchProjectSectors = debounce(fetchProjectSectors, 0)

  useEffect(() => {
    if (crossCuttingFields.project_type) {
      debouncedFetchProjectSectors()
    } else {
      setSectorsOpts([])
    }
  }, [projIdentifiers.cluster, crossCuttingFields.project_type])

  useEffect(() => {
    if (projectTypesOpts.length > 0) {
      if (!find(projectTypesOpts, { id: crossCuttingFields?.project_type })) {
        setCrossCuttingFields((prevFilters) => ({
          ...prevFilters,
          project_type: null,
        }))
      }
    }
  }, [projectTypesOpts])

  useEffect(() => {
    if (
      !crossCuttingFields?.project_type ||
      (sectorsOpts.length > 0 &&
        !find(sectorsOpts, { id: crossCuttingFields?.sector }))
    ) {
      setCrossCuttingFields((prevFilters) => ({
        ...prevFilters,
        sector: null,
      }))
    }
  }, [sectorsOpts, crossCuttingFields?.project_type])

  const defaultPropsDateInput = {
    className: 'BPListUpload !ml-0 h-10 w-40',
  }

  const handleChangeProjectType = (type: ProjectTypeType | null) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      project_type: type?.id ?? null,
    }))
  }

  const handleChangeSector = (sector: ProjectSectorType | null) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      sector: sector?.id ?? null,
    }))
  }

  const handleChangeSubSector = (subsectors: ProjectSubSectorType[]) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      subsector: subsectors.map((subsector) => subsector.id) ?? [],
    }))
  }

  const handleChangeLvcNonLvc = (is_lvc: BooleanFieldType | null) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      is_lvc: !isNil(is_lvc?.value) ? is_lvc?.value : null,
    }))
  }

  const handleChangeTitle = (event: ChangeEvent<HTMLInputElement>) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      title: event.target.value,
    }))
  }

  const handleChangeDescription = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      description: event.target.value,
    }))
  }

  const handleChangeProjectFunding = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    if (value.trim() !== '' && !isNaN(Number(value))) {
      setCrossCuttingFields((prevFilters: any) => ({
        ...prevFilters,
        total_fund: Number(event.target.value),
      }))
    } else {
      event.preventDefault()
    }
  }

  const handleChangeProjectSupportCost = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value

    if (value.trim() !== '' && !isNaN(Number(value))) {
      setCrossCuttingFields((prevFilters: any) => ({
        ...prevFilters,
        support_cost_psc: Number(event.target.value),
      }))
    } else {
      event.preventDefault()
    }
  }

  const handleChangeBlanketConsideration = (consideration: boolean) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      individual_consideration: !consideration,
    }))
  }

  const handleChangeProjectStartDate = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      project_start_date: event.target.value,
    }))
  }

  const handleChangeProjectEndDate = (event: ChangeEvent<HTMLInputElement>) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      project_end_date: event.target.value,
    }))
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>{tableColumns.type}</Label>
          <Field<ProjectTypeType>
            widget="autocomplete"
            options={projectTypesOpts}
            value={crossCuttingFields?.project_type as ProjectTypeType | null}
            onChange={(_: React.SyntheticEvent, value) =>
              handleChangeProjectType(value as ProjectTypeType | null)
            }
            getOptionLabel={(option: any) =>
              getOptionLabel(projectTypesOpts, option)
            }
            {...defaultProps}
          />
        </div>
        <div>
          <Label>{tableColumns.sector}</Label>
          <Field<ProjectSectorType>
            widget="autocomplete"
            options={sectorsOpts}
            value={crossCuttingFields?.sector as ProjectSectorType | null}
            onChange={(_: any, value) =>
              handleChangeSector(value as ProjectSectorType | null)
            }
            getOptionLabel={(option) => getOptionLabel(sectorsOpts, option)}
            {...defaultProps}
          />
        </div>
        <div>
          <Label>{tableColumns.subsector}</Label>
          <Field<ProjectSubSectorType>
            widget="autocomplete"
            multiple={true}
            options={subsectors}
            value={
              filter(subsectors, (subsector) =>
                includes(crossCuttingFields.subsector, subsector.id),
              ) as ProjectSubSectorType[]
            }
            onChange={(_: any, value) =>
              handleChangeSubSector(value as ProjectSubSectorType[])
            }
            getOptionLabel={(option) => getOptionLabel(subsectors, option)}
            FieldProps={{ className: 'mb-0 w-[640px] BPListUpload' }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>{tableColumns.is_lvc}</Label>
          <Field<BooleanFieldType>
            widget="autocomplete"
            options={lvcNonLvcOpts}
            value={
              (find(lvcNonLvcOpts, { value: crossCuttingFields?.is_lvc }) ||
                null) as BooleanFieldType | null
            }
            onChange={(_: any, value: any) =>
              handleChangeLvcNonLvc(value as BooleanFieldType | null)
            }
            getOptionLabel={(option: any) =>
              getOptionLabel(lvcNonLvcOpts, option, 'value')
            }
            isOptionEqualToValue={isOptionEqualToValueByValue}
            {...defaultProps}
          />
        </div>
        <div>
          <Label>{tableColumns.title}</Label>
          <SimpleInput
            id={crossCuttingFields?.title}
            value={crossCuttingFields?.title}
            onChange={handleChangeTitle}
            type="text"
            {...defaultPropsSimpleField}
            containerClassName={
              defaultPropsSimpleField.containerClassName + ' !w-[400px]'
            }
          />
        </div>
      </div>
      <div>
        <Label>{tableColumns.description}</Label>
        <TextareaAutosize
          value={crossCuttingFields?.description}
          onChange={handleChangeDescription}
          className={textAreaClassname}
          minRows={3}
          tabIndex={-1}
        />
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>{tableColumns.total_fund}</Label>
          <SimpleInput
            id={crossCuttingFields?.total_fund}
            value={crossCuttingFields?.total_fund}
            onChange={handleChangeProjectFunding}
            type="number"
            {...defaultPropsSimpleField}
          />
        </div>
        <div>
          <Label>{tableColumns.support_cost_psc}</Label>
          <SimpleInput
            id={crossCuttingFields?.support_cost_psc}
            value={crossCuttingFields?.support_cost_psc}
            onChange={handleChangeProjectSupportCost}
            type="number"
            {...defaultPropsSimpleField}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>{tableColumns.project_start_date}</Label>
          <DateInput
            id="project_start_date"
            value={crossCuttingFields?.project_start_date}
            onChange={handleChangeProjectStartDate}
            formatValue={(value) => dayjs(value).format('MM/DD/YYYY')}
            {...defaultPropsDateInput}
          />
        </div>
        <div>
          <Label>{tableColumns.project_end_date}</Label>
          <DateInput
            id="project_end_date"
            value={crossCuttingFields?.project_end_date}
            onChange={handleChangeProjectEndDate}
            formatValue={(value) => dayjs(value).format('MM/DD/YYYY')}
            {...defaultPropsDateInput}
          />
        </div>
      </div>
      <div className="flex">
        <Label>Blanket consideration</Label>
        <Checkbox
          className="pb-1 pl-2 pt-0"
          checked={!crossCuttingFields?.individual_consideration}
          onChange={(_: any, value: any) =>
            handleChangeBlanketConsideration(value)
          }
          sx={{
            color: 'black',
          }}
        />
      </div>
    </div>
  )
}

export default ProjectCrossCuttingFields
