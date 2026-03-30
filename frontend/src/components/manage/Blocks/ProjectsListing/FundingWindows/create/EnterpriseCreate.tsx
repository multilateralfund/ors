import { useEffect } from 'react'

import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext.tsx'
import EnterpriseForm from './EnterpriseForm.tsx'
import { enterpriseFieldsMapping } from '../../ProjectsEnterprises/constants.ts'
import { getFieldErrors } from '../../ProjectsEnterprises/utils.ts'
import { EnterpriseDataProps, EnterpriseOverview } from '../../interfaces.ts'
import { formatErrors } from '../../utils.ts'
import useVisibilityChange from '@ors/hooks/useVisibilityChange.ts'

const EnterpriseCreate = ({
  enterpriseData,
  setEnterpriseData,
  errors,
  ...rest
}: EnterpriseDataProps) => {
  const { updatedFields, addUpdatedField, clearUpdatedFields } =
    useUpdatedFields()

  useEffect(() => {
    clearUpdatedFields()
  }, [])

  const setEnterpriseDataWithEditTracking = (
    updater: React.SetStateAction<EnterpriseOverview>,
    fieldName?: string,
  ) => {
    setEnterpriseData((prevData) => {
      if (fieldName) {
        addUpdatedField(fieldName)
      }

      return typeof updater === 'function'
        ? (updater as (prev: EnterpriseOverview) => EnterpriseOverview)(
            prevData,
          )
        : updater
    })
  }

  useVisibilityChange(updatedFields.size > 0)

  const enterpriseErrors = getFieldErrors(enterpriseData, errors)
  const formattedErrors = formatErrors(
    enterpriseErrors,
    enterpriseFieldsMapping,
  )

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
      <EnterpriseForm
        errors={enterpriseErrors}
        setEnterpriseData={setEnterpriseDataWithEditTracking}
        {...{ enterpriseData, ...rest }}
      />
    </div>
  )
}

export default EnterpriseCreate
