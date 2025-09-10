import { Dispatch, SetStateAction } from 'react'

import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import Field from '@ors/components/manage/Form/Field'
import { EnterpriseOverview, EnterpriseData } from '../../interfaces'
import { defaultProps } from '../../constants'

import { useParams } from 'wouter'
import { find } from 'lodash'

interface EnterpiseSeachProps {
  enterprises: (EnterpriseOverview & { id: number })[]
  enterpriseData: EnterpriseData
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseData>>
}

const PEnterpriseSearch = ({
  enterprises,
  enterpriseData,
  setEnterpriseData,
}: EnterpiseSeachProps) => {
  const { enterprise_id } = useParams<Record<string, string>>()

  const overviewData = enterpriseData.overview as EnterpriseOverview & {
    id?: number | null
  }

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
        disabled={!!enterprise_id}
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
