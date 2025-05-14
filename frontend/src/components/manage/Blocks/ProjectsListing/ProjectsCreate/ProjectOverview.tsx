import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { BooleanFieldType } from './ProjectCrossCuttingFields'
import { SpecificFieldsSectionProps } from '../interfaces'
import { ProjectSubstancesGroupsType } from '@ors/types/api_project_substances_groups'
import { useStore } from '@ors/store'
import {
  tableColumns,
  trancheOpts,
  isSmeOpts,
  defaultProps,
  widgetsMapping,
} from '../constants'
import { isOptionEqualToValueByValue } from '../utils'

import { filter, find, get, isNil, isObject } from 'lodash'
import { widgets } from './SpecificFieldsHelpers'

export type TrancheType = {
  name: number
  id: number
}

const ProjectOverview = ({
  projectSpecificFields,
  setProjectSpecificFields,
  specificFields,
}: SpecificFieldsSectionProps) => {
  const fields = filter(specificFields, (field) => field.section === 'Header')

  const projectSlice = useStore((state) => state.projects)

  const handleChangeSubstancesGroups = (
    group: ProjectSubstancesGroupsType | null,
  ) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      group: group?.id ?? null,
    }))
  }

  const handleChangeTranche = (tranche: TrancheType | null) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      tranche: tranche?.id ?? null,
    }))
  }

  const handleChangeSmeNonSme = (is_sme: BooleanFieldType | null) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      is_sme: !isNil(is_sme?.value) ? is_sme?.value : null,
    }))
  }

  const getGroupOptionLabel = (data: any, option: any, field: string = 'id') =>
    isObject(option)
      ? get(option, 'name_alt')
      : find(data, { [field]: option })?.name_alt || ''

  const getOptionLabel = (data: any, option: any, field: string = 'id') =>
    isObject(option)
      ? get(option, 'name_alt')
      : find(data, { [field]: option })?.name_alt || ''

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          <div>
            <Label>{tableColumns.group}</Label>
            <Field<ProjectSubstancesGroupsType>
              widget="autocomplete"
              options={projectSlice.substances_groups.data}
              value={
                projectSpecificFields?.group as ProjectSubstancesGroupsType | null
              }
              onChange={(_: React.SyntheticEvent, value) =>
                handleChangeSubstancesGroups(
                  value as ProjectSubstancesGroupsType | null,
                )
              }
              getOptionLabel={(option: any) =>
                getGroupOptionLabel(projectSlice.substances_groups.data, option)
              }
              {...defaultProps}
              FieldProps={{
                className: defaultProps.FieldProps.className + ' w-[12rem]',
              }}
            />
          </div>
          <div>
            <Label>{tableColumns.tranche}</Label>
            <Field<TrancheType>
              widget="autocomplete"
              options={trancheOpts}
              value={projectSpecificFields?.tranche as TrancheType | null}
              onChange={(_: React.SyntheticEvent, value) =>
                handleChangeTranche(value as TrancheType | null)
              }
              getOptionLabel={(option: any) =>
                getOptionLabel(trancheOpts, option)
              }
              {...defaultProps}
            />
          </div>
          <div>
            <Label>{tableColumns.is_sme}</Label>
            <Field<BooleanFieldType>
              widget="autocomplete"
              options={isSmeOpts}
              value={
                (find(isSmeOpts, { value: projectSpecificFields?.is_sme }) ||
                  null) as BooleanFieldType | null
              }
              onChange={(_: any, value: any) =>
                handleChangeSmeNonSme(value as BooleanFieldType | null)
              }
              getOptionLabel={(option: any) =>
                getOptionLabel(isSmeOpts, option, 'value')
              }
              isOptionEqualToValue={isOptionEqualToValueByValue}
              {...defaultProps}
            />
          </div>
        </div>
      </div>

      {fields.map((field) =>
        // <div>
        //   <Label>{field.label}</Label>
        //   <Field
        //     // <ProjectSubstancesGroupsType>
        //     widget={widgetsMapping[field.data_type]}
        //     options={field.options}
        //     value={projectSpecificFields[field.field_name]}
        //     onChange={(_: React.SyntheticEvent, value) =>
        //       handler[field.data_type](
        //         value,
        //         field.field_name,
        //         setProjectSpecificFields,
        //       )
        //     }
        //     getOptionLabel={(option: any) =>
        //       getOptionLabel(field.options, option)
        //     }
        //     {...defaultProps}
        //   />
        // </div>
        widgets[field.data_type](
          field,
          projectSpecificFields,
          setProjectSpecificFields,
        ),
      )}
    </>
  )
}

export default ProjectOverview
