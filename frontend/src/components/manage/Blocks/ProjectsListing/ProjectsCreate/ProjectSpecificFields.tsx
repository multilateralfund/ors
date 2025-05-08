import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { SpecificFields } from './ProjectsCreate'
import { defaultProps, tableColumns, trancheOpts } from '../constants'

export type TrancheType = {
  name: number
  id: number
}

const ProjectSpecificFields = ({
  projectSpecificFields,
  setProjectSpecificFields,
}: {
  projectSpecificFields: SpecificFields
  setProjectSpecificFields: React.Dispatch<React.SetStateAction<SpecificFields>>
}) => {
  const handleChangeTranche = (tranche: TrancheType | null) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      tranche: tranche?.id ?? null,
    }))
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-x-20 gap-y-3">
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
      </div>
    </div>
  )
}

export default ProjectSpecificFields
