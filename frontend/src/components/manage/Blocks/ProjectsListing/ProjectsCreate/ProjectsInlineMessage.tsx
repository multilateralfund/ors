import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import Link from '@ors/components/ui/Link/Link'
import { InlineMessageProps } from '../interfaces'

import { IoMdClose } from 'react-icons/io'
import { map } from 'lodash'
import cx from 'classnames'

const ProjectsInlineMessage = ({
  inlineMessage,
  setInlineMessage,
}: InlineMessageProps) => {
  const {
    type = 'success',
    message,
    errorMessages,
    redirectMessage,
    hrefRedirect,
  } = inlineMessage ?? {}
  const messageClassname = 'm-0 mt-0.5 text-lg text-inherit'

  return (
    <CustomAlert
      type={type}
      alertClassName="mb-3 BPAlert"
      content={
        <div className="flex items-center gap-1.5">
          {hrefRedirect ? (
            <Link
              className={cx('no-underline', messageClassname)}
              href={hrefRedirect}
            >
              {message} <span className="underline">{redirectMessage}</span>
            </Link>
          ) : (
            <div className={messageClassname}>
              {message}
              {map(errorMessages, (err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </div>
          )}
          {type === 'success' && (
            <span
              className="cursor-pointer"
              onClick={() => setInlineMessage(null)}
            >
              <IoMdClose size={18} />
            </span>
          )}
        </div>
      }
    />
  )
}

export default ProjectsInlineMessage
