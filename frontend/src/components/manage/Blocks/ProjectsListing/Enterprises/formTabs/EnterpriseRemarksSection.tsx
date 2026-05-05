import { EnterpriseTextAreaField } from '../FormHelperComponents'
import { EnterpriseDataProps } from '../../interfaces'
import { remarksFields } from '../constants'

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
