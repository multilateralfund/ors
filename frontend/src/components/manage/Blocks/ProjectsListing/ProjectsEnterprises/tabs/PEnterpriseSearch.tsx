import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { EnterpriseType, PEnterpriseDataType } from '../../interfaces'
import { defaultProps } from '../../constants'

import { find } from 'lodash'

const PEnterpriseSearch = ({
  enterprises,
  enterpriseData,
  setEnterpriseData,
}: PEnterpriseDataType & {
  enterprises: EnterpriseType[]
}) => {
  const overviewData = enterpriseData.overview as EnterpriseType

  const onEnterpriseChange = (value: any) => {
    const enterpriseId = value?.id ?? null

    if (enterpriseId) {
      const crtEnterprise = find(
        enterprises,
        (option) => option.id === enterpriseId,
      )

      if (crtEnterprise) {
        setEnterpriseData((prevData) => ({
          ...prevData,
          overview: {
            id: enterpriseId,
            name: crtEnterprise.name,
            agencies: crtEnterprise.agencies,
            country: crtEnterprise.country,
            location: crtEnterprise.location,
            application: crtEnterprise.application,
            local_ownership: crtEnterprise.local_ownership,
            export_to_non_a5: crtEnterprise.export_to_non_a5,
            remarks: crtEnterprise.remarks,
          },
        }))
      }
    } else {
      setEnterpriseData((prevData) => ({
        ...prevData,
        overview: {
          ...prevData['overview'],
          id: null,
        },
      }))
    }
  }

  return (
    <>
      <Label>Enterprise</Label>
      <Field
        widget="autocomplete"
        options={enterprises}
        value={overviewData.id}
        onChange={(_, value) => {
          onEnterpriseChange(value)
        }}
        getOptionLabel={(option: any) => getOptionLabel(enterprises, option)}
        {...defaultProps}
      />
    </>
  )
}

export default PEnterpriseSearch
