import { ChangeEvent } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { NavigationButton } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/NavigationButton'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { tableColumns } from '../constants'

import { useStore } from '@ors/store'

import { TextareaAutosize } from '@mui/material'

const ProjectCrossCuttingFields = ({
  crossCuttingFields,
  setCrossCuttingFields,
  ...rest
}: any) => {
  const projectSlice = useStore((state) => state.projects)

  const defaultProps = {
    FieldProps: { className: 'mb-0 w-40 BPListUpload' },
  }

  const isNextBtnEnabled =
    crossCuttingFields.title && crossCuttingFields.project_type

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

  const handleChangeProjectType = (type: any) => {
    setCrossCuttingFields((prevFilters: any) => ({
      ...prevFilters,
      project_type: type?.id ?? null,
    }))
  }

  const handleChangeSector = (sector: any) => {
    setCrossCuttingFields((prevFilters: any) => ({
      ...prevFilters,
      sector: sector?.id ?? null,
    }))
  }

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label isRequired>{tableColumns.title}</Label>
          <SimpleInput
            id={crossCuttingFields?.title}
            value={crossCuttingFields?.title}
            onChange={handleChangeTitle}
            className="BPListUpload mb-0 w-40 border-primary"
            label=""
            type="text"
            containerClassName="!h-fit w-40"
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
      </div>

      {/* <div className="flex flex-wrap items-center gap-2.5">
        <NavigationButton
          isBtnDisabled={!isNextBtnEnabled}
          direction={'next'}
          {...rest}
        />
        <NavigationButton direction={'back'} {...rest} />
      </div> */}
    </>
  )
}

export default ProjectCrossCuttingFields
