import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import Link from '@ors/components/ui/Link/Link'
import { InlineMessageType } from '../interfaces'

const ProjectsInlineMessage = ({
  successMessage,
}: {
  successMessage: InlineMessageType
}) => {
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
        hrefRedirect ? (
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
        )
      }
    />
  )
}

export default ProjectsInlineMessage
