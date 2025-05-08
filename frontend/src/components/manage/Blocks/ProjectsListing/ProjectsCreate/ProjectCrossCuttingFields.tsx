import { ChangeEvent } from 'react'
import type { CrossCuttingFields } from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreate.tsx'
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
  blanketOrIndConsiderationOpts,
  lvcNonLvcOpts,
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
} from '../constants'
import { isOptionEqualToValueByValue } from '../utils'
import { useStore } from '@ors/store'

import { TextareaAutosize } from '@mui/material'
import { find, isNil } from 'lodash'
import dayjs from 'dayjs'

export type BooleanFieldType = {
  name: string
  value: boolean
}

const ProjectCrossCuttingFields = ({
  crossCuttingFields,
  setCrossCuttingFields,
}: {
  crossCuttingFields: CrossCuttingFields
  setCrossCuttingFields: React.Dispatch<
    React.SetStateAction<CrossCuttingFields>
  >
}) => {
  const projectSlice = useStore((state) => state.projects)

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

  const handleChangeSubSector = (
    subsectors: (ProjectSubSectorType | string)[] | null,
  ) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      subsector: subsectors
        ? subsectors.map((subsector) =>
            typeof subsector === 'string' ? subsector : subsector.id.toString(),
          )
        : [],
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

  const handleChangeBlanketConsideration = (
    consideration: BooleanFieldType | null,
  ) => {
    setCrossCuttingFields((prevFilters) => ({
      ...prevFilters,
      individual_consideration: !isNil(consideration?.value)
        ? consideration?.value
        : null,
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
            options={projectSlice.types.data}
            value={crossCuttingFields?.project_type as ProjectTypeType | null}
            onChange={(_: React.SyntheticEvent, value) =>
              handleChangeProjectType(value as ProjectTypeType | null)
            }
            getOptionLabel={(option: any) =>
              getOptionLabel(projectSlice.types.data, option)
            }
            {...defaultProps}
          />
        </div>
        <div>
          <Label>{tableColumns.sector}</Label>
          <Field<ProjectSectorType>
            widget="autocomplete"
            options={projectSlice.sectors.data}
            value={crossCuttingFields?.sector as ProjectSectorType | null}
            onChange={(_: any, value) =>
              handleChangeSector(value as ProjectSectorType | null)
            }
            getOptionLabel={(option) =>
              getOptionLabel(projectSlice.sectors.data, option)
            }
            {...defaultProps}
          />
        </div>
        <div>
          <Label>Sub-Sector</Label>
          <Field<ProjectSubSectorType>
            widget="autocomplete"
            multiple={true}
            options={projectSlice.subsectors.data}
            value={crossCuttingFields?.subsector}
            onChange={(_: any, value) =>
              handleChangeSubSector(
                value as (ProjectSubSectorType | string)[] | null,
              )
            }
            getOptionLabel={(option) => {
              const value =
                typeof option === 'string' ? parseInt(option, 10) : option
              return getOptionLabel(projectSlice.subsectors.data, value)
            }}
            {...defaultProps}
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
      <div>
        <Label>{tableColumns.individual_consideration}</Label>
        <Field<BooleanFieldType>
          widget="autocomplete"
          options={blanketOrIndConsiderationOpts}
          value={
            (find(blanketOrIndConsiderationOpts, {
              value: crossCuttingFields?.individual_consideration,
            }) || null) as BooleanFieldType | null
          }
          onChange={(_: any, value: any) =>
            handleChangeBlanketConsideration(value as BooleanFieldType | null)
          }
          getOptionLabel={(option: any) =>
            getOptionLabel(blanketOrIndConsiderationOpts, option, 'value')
          }
          isOptionEqualToValue={isOptionEqualToValueByValue}
          {...defaultProps}
        />
      </div>
    </div>
  )
}

export default ProjectCrossCuttingFields
