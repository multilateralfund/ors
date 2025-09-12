import { useEffect } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { EnterpriseType, PEnterpriseDataProps } from '../../interfaces'
import { getEntityById, getOptionLabel } from '../utils'
import { defaultProps } from '../../constants'

import { createFilterOptions } from '@mui/material'

const PEnterpriseSearch = ({
  enterpriseData,
  setEnterpriseData,
  enterprises,
  enterprise,
}: PEnterpriseDataProps & {
  enterprises: EnterpriseType[]
}) => {
  const overviewData = enterpriseData.overview as EnterpriseType
  const enterpriseId = overviewData.id
  const isDisabled = !!enterprise && enterprise.status !== 'Pending Approval'

  const customFiltering = createFilterOptions({
    stringify: (option: any) => `${option.name} ${option.code}`,
  })

  useEffect(() => {
    if (enterpriseId && !getEntityById(enterprises, enterpriseId)) {
      setEnterpriseData((prevData) => ({
        ...prevData,
        overview: {
          ...prevData.overview,
          id: null,
          status: '',
        },
      }))
    }
  }, [enterpriseId])

  const onEnterpriseChange = (value: any) => {
    const enterpriseId = value?.id ?? null

    if (enterpriseId) {
      const crtEnterprise = getEntityById(enterprises, enterpriseId)

      if (crtEnterprise) {
        setEnterpriseData((prevData) => ({
          ...prevData,
          overview: {
            id: enterpriseId,
            status: crtEnterprise.status,
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
          status: '',
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
        value={enterpriseId}
        disabled={isDisabled}
        onChange={(_, value) => {
          onEnterpriseChange(value)
        }}
        getOptionLabel={(option: any) =>
          getOptionLabel(enterprises, option, 'code')
        }
        filterOptions={customFiltering}
        {...defaultProps}
      />
    </>
  )
}

export default PEnterpriseSearch
