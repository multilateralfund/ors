import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import Link from '@ors/components/ui/Link/Link'
import { InlineMessageProps } from '../interfaces'

import { IoMdClose } from 'react-icons/io'

const ProjectsInlineMessage = ({
  successMessage,
  setSuccessMessage,
}: InlineMessageProps) => {
  const {
    type = 'success',
    message,
    redirectMessage,
    hrefRedirect,
  } = successMessage ?? {}

  return (
    <CustomAlert
      type={type}
      alertClassName="mb-3 BPAlert"
      content={
        <div className="flex items-center gap-1.5">
          {hrefRedirect ? (
            <Link
              className="text-xl text-inherit no-underline"
              href={hrefRedirect}
            >
              <p className="m-0 mt-0.5 text-lg">
                {message} <span className="underline">{redirectMessage}</span>
              </p>
            </Link>
          ) : (
            <div className="text-xl text-inherit">
              <p className="m-0 mt-0.5 text-lg">{message}</p>
            </div>
          )}
          <span
            className="cursor-pointer"
            onClick={() => setSuccessMessage(null)}
          >
            <IoMdClose size={18} />
          </span>
        </div>
      }
    />
  )
}

export default ProjectsInlineMessage
