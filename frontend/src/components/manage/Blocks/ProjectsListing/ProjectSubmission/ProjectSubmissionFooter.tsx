import Link from '@ors/components/ui/Link/Link'

import { Alert } from '@mui/material'
import { map } from 'lodash'

const ProjectSubmissionFooter = ({
  projectId,
  nonFieldsErrors,
  fileErrors,
}: {
  projectId: number | null
  nonFieldsErrors: string[]
  fileErrors: string
}) => {
  return (
    <>
      {projectId && (
        <Alert className="BPAlert mt-4 w-fit border-0" severity="success">
          <Link
            className="text-xl text-inherit no-underline"
            href={`/projects-listing/${projectId}`}
          >
            <p className="m-0 mt-0.5 text-lg">
              Submission was successful. View project.
            </p>
          </Link>
        </Alert>
      )}

      {(nonFieldsErrors.length > 0 || fileErrors) && (
        <Alert className="BPAlert mt-4 w-fit border-0" severity="error">
          <div className="mt-0.5 text-lg">
            {map(nonFieldsErrors, (err, idx) => (
              <div key={idx}>{err}</div>
            ))}
            {fileErrors && (
              <div>An error occurred while uploading files. {fileErrors}</div>
            )}
          </div>
        </Alert>
      )}
    </>
  )
}

export default ProjectSubmissionFooter
