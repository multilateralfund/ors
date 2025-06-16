import Link from '@ors/components/ui/Link/Link'

import { MdErrorOutline } from 'react-icons/md'
import { BsCheck2Circle } from 'react-icons/bs'
import { Alert } from '@mui/material'
import { map } from 'lodash'

const ProjectSubmissionFooter = ({
  projectId,
  nonFieldsErrors,
  successMessage,
}: {
  projectId: number | null
  nonFieldsErrors: string[]
  successMessage: string
}) => {
  return (
    <>
      {projectId ? (
        <Alert
          className="BPAlert mt-4 w-fit border-0 bg-[#F9FCCF] text-[#373C00]"
          severity="success"
          icon={<BsCheck2Circle color="#373C00" style={{ strokeWidth: 0.5 }} />}
        >
          <Link
            className="text-xl text-inherit no-underline"
            href={`/projects-listing/${projectId}`}
          >
            <p className="m-0 mt-0.5 text-lg">
              {successMessage} <span className="underline">View project.</span>
            </p>
          </Link>
        </Alert>
      ) : (
        nonFieldsErrors.length > 0 && (
          <Alert
            className="BPAlert mt-4 w-fit border-0 bg-[#FAECD1] text-[#291B00]"
            severity="error"
            icon={<MdErrorOutline color="#291B00" />}
          >
            <div className="mt-0.5 text-lg">
              {map(nonFieldsErrors, (err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </div>
          </Alert>
        )
      )}
    </>
  )
}

export default ProjectSubmissionFooter
