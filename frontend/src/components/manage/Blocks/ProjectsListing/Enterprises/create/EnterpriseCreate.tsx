'use client'

import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import EnterprisesOverviewSection from './EnterprisesOverviewSection.tsx'
import { getEnterprisesErrors } from '../../ProjectsEnterprises/utils.ts'
import { EnterpriseDataProps } from '../../interfaces.ts'
import { formatErrors } from '../../utils.ts'

const EnterpriseCreate = ({
  enterpriseData,
  errors,
  ...rest
}: EnterpriseDataProps) => {
  const enterpriseErrors = getEnterprisesErrors(enterpriseData, errors)
  const formattedErrors = formatErrors(enterpriseErrors)

  return (
    <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
      {formattedErrors.length > 0 && (
        <CustomAlert
          type="error"
          alertClassName="mb-5"
          content={
            <div className="flex flex-col gap-1.5 text-base">
              {formattedErrors.map((err, idx) => (
                <div key={idx}>
                  {'\u2022'} {err.message}
                </div>
              ))}
            </div>
          }
        />
      )}
      <EnterprisesOverviewSection
        errors={enterpriseErrors}
        {...{ enterpriseData, ...rest }}
      />
    </div>
  )
}

export default EnterpriseCreate
