import { viewModesHandler } from './ViewHelperComponents'
import { ProjectViewProps } from '../interfaces'
import { canViewField } from '../utils'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const ProjectApproval = ({ project, specificFields }: ProjectViewProps) => {
  const { viewableFields } = useStore((state) => state.projectFields)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3">
        {map(
          specificFields,
          (field) =>
            canViewField(viewableFields, field.write_field_name) &&
            viewModesHandler[field.data_type](
              project,
              field,
              field.write_field_name === 'excom_provision'
                ? {
                    containerClassName: 'col-span-full w-full',
                    className: 'whitespace-nowrap',
                    fieldClassName: 'max-w-[50%]',
                  }
                : undefined,
            ),
        )}
      </div>
    </div>
  )
}

export default ProjectApproval
