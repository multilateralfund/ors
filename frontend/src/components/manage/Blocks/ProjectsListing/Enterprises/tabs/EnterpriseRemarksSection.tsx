import { EnterpriseTextAreaField } from '../../ProjectsEnterprises/FormHelperComponents'
import { remarksFields } from '../../ProjectsEnterprises/constants'
import { EnterpriseDataProps } from '../../interfaces'

import { map } from 'lodash'

const EnterpriseRemarksSection = (props: EnterpriseDataProps) => (
  <div className="flex max-w-[41rem] flex-col gap-y-2">
    {map(remarksFields, (field, index) => (
      <EnterpriseTextAreaField
        key={index}
        sectionIdentifier="remarks"
        {...{ field, ...props }}
      />
    ))}
  </div>
)

export default EnterpriseRemarksSection
