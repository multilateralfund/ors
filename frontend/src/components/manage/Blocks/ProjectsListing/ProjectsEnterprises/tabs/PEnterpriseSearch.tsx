import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { EnterpriseType, PEnterpriseDataProps } from '../../interfaces'
import { getEntityById, getOptionLabel } from '../utils'
import { getFormattedDecimalValue } from '../../utils'
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

  const customFiltering = createFilterOptions({
    stringify: (option: any) => `${option.name} ${option.code}`,
  })

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
            country: crtEnterprise.country,
            location: crtEnterprise.location,
            stage: crtEnterprise.stage,
            sector: crtEnterprise.sector,
            subsector: crtEnterprise.subsector,
            application: crtEnterprise.application,
            local_ownership: getFormattedDecimalValue(
              crtEnterprise.local_ownership,
            ),
            export_to_non_a5: getFormattedDecimalValue(
              crtEnterprise.export_to_non_a5,
            ),
            revision: crtEnterprise.revision,
            date_of_revision: crtEnterprise.date_of_revision,
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
      <Label>Select existing enterprise</Label>
      <Field
        widget="autocomplete"
        options={enterprises}
        value={enterpriseId}
        disabled={!!enterprise}
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
