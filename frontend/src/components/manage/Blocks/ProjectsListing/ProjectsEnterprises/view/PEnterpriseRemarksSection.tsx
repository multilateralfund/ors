import { detailItem } from '../../ProjectView/ViewHelperComponents'
import { enterpriseFieldsMapping, remarksFields } from '../constants'
import { PEnterpriseType } from '../../interfaces'

import { map } from 'lodash'

const PEnterpriseRemarksSection = ({
  enterprise,
}: {
  enterprise: PEnterpriseType
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

export default PEnterpriseRemarksSection
