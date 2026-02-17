import { useEffect, useState } from 'react'

import EnterpriseHeader from '../create/EnterpriseHeader'
import EnterpriseCreate from '../create/EnterpriseCreate'
import ProjectFormFooter from '../../ProjectFormFooter'
import { initialOverviewFields } from '../../ProjectsEnterprises/constants'
import { EnterpriseOverview, EnterpriseType } from '../../interfaces'
import { getFormattedDecimalValue } from '../../utils'

const EnterpriseEdit = ({ enterprise }: { enterprise: EnterpriseType }) => {
  const [enterpriseData, setEnterpriseData] = useState<EnterpriseOverview>(
    initialOverviewFields,
  )
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [otherErrors, setOtherErrors] = useState<string>('')
  const nonFieldsErrors = errors?.['non_field_errors'] || []

  useEffect(() => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      name: enterprise.name,
      country: enterprise.country,
      location: enterprise.location,
      stage: enterprise.stage,
      sector: enterprise.sector,
      subsector: enterprise.subsector,
      application: enterprise.application,
      local_ownership: getFormattedDecimalValue(enterprise.local_ownership),
      export_to_non_a5: getFormattedDecimalValue(enterprise.export_to_non_a5),
      revision: enterprise.revision,
      date_of_revision: enterprise.date_of_revision,
    }))
  }, [])

  return (
    <>
      <EnterpriseHeader
        mode="edit"
        {...{
          enterpriseData,
          enterprise,
          setEnterpriseId,
          setErrors,
          setOtherErrors,
        }}
      />
      <EnterpriseCreate
        mode="edit"
        {...{
          enterpriseData,
          setEnterpriseData,
          enterprise,
          errors,
        }}
      />
      <ProjectFormFooter
        id={enterpriseId}
        href={`/projects-listing/enterprises/${enterpriseId}`}
        successMessage="Enterprise was updated successfully."
        successRedirectMessage="View enterprise."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default EnterpriseEdit
