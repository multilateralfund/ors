import { detailItem } from '../../ProjectView/ViewHelperComponents'
import { enterpriseFieldsMapping, remarksFields } from '../constants'
import { EnterpriseType } from '../interfaces'

import { map } from 'lodash'

const EnterpriseRemarksSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => (
  <div className="flex flex-col gap-4">
    {map(remarksFields, (field) => (
      <div key={field} className="max-w-[90%]">
        {detailItem(
          enterpriseFieldsMapping[field],
          enterprise[field as keyof typeof enterprise] as string,
          {
            detailClassname: 'self-start',
          },
        )}
      </div>
    ))}
  </div>
)

export default EnterpriseRemarksSection
