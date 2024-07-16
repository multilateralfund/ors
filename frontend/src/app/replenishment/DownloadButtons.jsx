import Portal from '@ors/components/manage/Utils/Portal'
import { DownloadLink, PrintButton } from '@ors/components/ui/Button/Button'

export default function DownloadButtons(props) {
  const { downloadUrl } = props
  return (
    <Portal active={true} domNode="replenishment-tab-buttons">
      <div className="mb-2 flex items-center gap-x-2">
        <DownloadLink
          href={downloadUrl ?? '#'}
          onClick={function (evt) {
            evt.preventDefault()
            alert('Not yet implemented.')
          }}
        >
          Download
        </DownloadLink>
        <PrintButton
          onClick={function () {
            window.print()
          }}
        >
          Print
        </PrintButton>
      </div>
    </Portal>
  )
}
