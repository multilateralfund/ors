import { EnterpriseTextAreaField } from '../FormHelperComponents'
import { EnterpriseFormProps } from '../interfaces'
import { remarksFields } from '../constants'
import { useStore } from '@ors/store'

import { filter } from 'lodash'

const EnterpriseRemarksSection = (props: EnterpriseFormProps) => {
  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  return (
    <div className="flex max-w-[41rem] flex-col gap-y-2">
      {filter(
        remarksFields,
        (field) => !agency_id || field === 'agency_remarks',
      ).map((field, index) => (
        <EnterpriseTextAreaField
          key={index}
          sectionIdentifier="remarks"
          {...{ field, ...props }}
        />
      ))}
    </div>
  )
}

export default EnterpriseRemarksSection
