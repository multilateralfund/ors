import { ChangeEvent } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { tableColumns } from '../constants'

import { useStore } from '@ors/store'

import { TextareaAutosize } from '@mui/material'

const ProjectCrossCuttingFields = ({
  crossCuttingFields,
  setCrossCuttingFields,
}: any) => {
  const projectSlice = useStore((state) => state.projects)

  const blanketOrIndConsiderationOpts = [
    { name: 'Blanket', id: 'blanket' },
    { name: 'Individual', id: 'individual' },
  ]
  const defaultProps = {
    FieldProps: { className: 'mb-0 w-40 BPListUpload' },
  }

  const defaultPropsSimpleField = {
    label: '',
    className: 'BPListUpload mb-0 w-40 border-primary project-input',
    containerClassName: '!h-fit w-40',
  }

  const handleChangeSector = (sector: any) => {
    setCrossCuttingFields((prevFilters: any) => ({
      ...prevFilters,
      sector: sector?.id ?? null,
    }))
  }

  const handleChangeProjectType = (type: any) => {
    setCrossCuttingFields((prevFilters: any) => ({
      ...prevFilters,
      project_type: type?.id ?? null,
    }))
  }

  const handleChangeTitle = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setCrossCuttingFields((prevFilters: any) => ({
      ...prevFilters,
      title: event.target.value,
    }))
  }

  const handleChangeDescription = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setCrossCuttingFields((prevFilters: any) => ({
      ...prevFilters,
      description: event.target.value,
    }))
  }

  const handleChangeProjectFunding = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.target.value

    if (value.trim() !== '' && !isNaN(Number(value))) {
      setCrossCuttingFields((prevFilters: any) => ({
        ...prevFilters,
        project_funding: Number(event.target.value),
      }))
    } else {
      event.preventDefault()
    }
  }

  const handleChangeProjectSupportCost = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.target.value

    if (value.trim() !== '' && !isNaN(Number(value))) {
      setCrossCuttingFields((prevFilters: any) => ({
        ...prevFilters,
        project_support_cost: Number(event.target.value),
      }))
    } else {
      event.preventDefault()
    }
  }

  const handleChangeBlanketConsideration = (consideration: any) => {
    setCrossCuttingFields((prevFilters: any) => ({
      ...prevFilters,
      blanket_consideration: consideration?.id ?? null,
    }))
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>{tableColumns.sector}</Label>
          <Field
            widget="autocomplete"
            options={projectSlice.sectors.data}
            value={crossCuttingFields?.sector}
            onChange={(_: any, value: any) => handleChangeSector(value)}
            getOptionLabel={(option: any) =>
              getOptionLabel(projectSlice.sectors.data, option)
            }
            {...defaultProps}
          />
        </div>
        <div>
          <Label isRequired>{tableColumns.type}</Label>
          <Field
            widget="autocomplete"
            options={projectSlice.types.data}
            value={crossCuttingFields?.project_type}
            onChange={(_: any, value: any) => handleChangeProjectType(value)}
            getOptionLabel={(option: any) =>
              getOptionLabel(projectSlice.types.data, option)
            }
            {...defaultProps}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label isRequired>{tableColumns.title}</Label>
          <SimpleInput
            id={crossCuttingFields?.title}
            value={crossCuttingFields?.title}
            onChange={handleChangeTitle}
            type="text"
            {...defaultPropsSimpleField}
          />
        </div>
        <div>
          <Label>Description</Label>
          <TextareaAutosize
            value={crossCuttingFields?.description}
            onChange={handleChangeDescription}
            placeholder="Type project description here..."
            minRows={3}
            tabIndex={-1}
            className="min-h-[30px] w-full min-w-[350px] rounded-lg border bg-white p-2 pb-10 shadow-none"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>Project funding</Label>
          <SimpleInput
            id={crossCuttingFields?.project_funding}
            value={crossCuttingFields?.project_funding}
            onChange={handleChangeProjectFunding}
            type="number"
            {...defaultPropsSimpleField}
          />
        </div>
        <div>
          <Label>Project support cost</Label>
          <SimpleInput
            id={crossCuttingFields?.project_support_cost}
            value={crossCuttingFields?.project_support_cost}
            onChange={handleChangeProjectSupportCost}
            type="number"
            {...defaultPropsSimpleField}
          />
        </div>
      </div>
      <div>
        <Label>Blanket or individual consideration</Label>
        <Field
          widget="autocomplete"
          options={blanketOrIndConsiderationOpts}
          value={crossCuttingFields?.blanket_consideration}
          onChange={(_: any, value: any) =>
            handleChangeBlanketConsideration(value)
          }
          getOptionLabel={(option: any) =>
            getOptionLabel(blanketOrIndConsiderationOpts, option)
          }
          {...defaultProps}
        />
      </div>
    </div>
  )
}

export default ProjectCrossCuttingFields
