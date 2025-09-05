import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import Link from '@ors/components/ui/Link/Link'

import { map } from 'lodash'

const ProjectFormFooter = ({
  id,
  href,
  nonFieldsErrors,
  otherErrors,
  successMessage,
  successRedirectMessage,
}: {
  id: number | null
  href: string
  nonFieldsErrors: string[]
  otherErrors: string
  successMessage: string
  successRedirectMessage: string
}) => (
  <>
    {id ? (
      <CustomAlert
        type="success"
        alertClassName="BPAlert mt-4"
        content={
          <Link className="text-xl text-inherit no-underline" href={href}>
            <p className="m-0 mt-0.5 text-lg">
              {successMessage}{' '}
              <span className="underline">{successRedirectMessage}</span>
            </p>
          </Link>
        }
      />
    ) : (
      (nonFieldsErrors.length > 0 || otherErrors) && (
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
      )
    )}
  </>
)

export default ProjectFormFooter
