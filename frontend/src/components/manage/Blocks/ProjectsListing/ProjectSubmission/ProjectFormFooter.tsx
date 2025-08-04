import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import Link from '@ors/components/ui/Link/Link'
import { map } from 'lodash'

const ProjectFormFooter = ({
  projectId,
  nonFieldsErrors,
  successMessage,
}: {
  projectId: number | null
  nonFieldsErrors: string[]
  successMessage: string
}) => (
  <>
    {projectId ? (
      <CustomAlert
        type="success"
        alertClassName="BPAlert mt-4"
        content={
          <Link
            className="text-xl text-inherit no-underline"
            href={`/projects-listing/${projectId}`}
          >
            <p className="m-0 mt-0.5 text-lg">
              {successMessage} <span className="underline">View project.</span>
            </p>
          </Link>
        }
      />
    ) : (
      nonFieldsErrors.length > 0 && (
        <CustomAlert
          type="error"
          alertClassName="BPAlert mt-4"
          content={
            <div className="mt-0.5 text-lg">
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
