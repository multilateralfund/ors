import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'

import { map } from 'lodash'

const ProjectFormFooter = ({
  id,
  nonFieldsErrors,
  otherErrors,
}: {
  id: number | null
  nonFieldsErrors: string[]
  otherErrors: string
}) => (
  <>
    {!id && (nonFieldsErrors.length > 0 || otherErrors) && (
      <CustomAlert
        type="error"
        alertClassName="BPAlert mt-4"
        content={
          <div className="mt-0.5 text-lg">
            {otherErrors}
            {map(nonFieldsErrors, (err, idx) => (
              <div key={idx}>{err}</div>
            ))}
          </div>
        }
      />
    )}
  </>
)

export default ProjectFormFooter
