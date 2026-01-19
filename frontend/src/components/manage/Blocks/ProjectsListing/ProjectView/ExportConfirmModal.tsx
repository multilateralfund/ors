import { CancelButton } from '../HelperComponents'
import { exportButtonClassname } from '../constants'
import { formatApiUrl } from '@ors/helpers'

import { Typography, Box, Modal } from '@mui/material'
import cx from 'classnames'

const ExportConfirmModal = ({
  mode,
  projectId,
  setModalType,
}: {
  mode: string
  projectId?: number
  setModalType: (type: string | null) => void
}) => {
  const isWordExport = mode === 'word-export'
  const title = isWordExport ? 'Download project summary' : 'Download Excel'

  const closeModal = () => {
    setModalType(null)
  }

  return (
    <Modal
      aria-labelledby="export-confirm-modal"
      open={!!mode}
      onClose={() => setModalType(null)}
      keepMounted
    >
      <Box className="flex w-full max-w-lg flex-col absolute-center">
        <Typography className="mb-4 text-[20px] font-medium text-black">
          {title}
        </Typography>
        <Typography className="mb-4 text-lg text-primary">
          The download will take under consideration the latest saved version of
          this project. Please ensure you updated the project before exporting!
        </Typography>
        <div className="ml-auto mr-6 flex flex-wrap gap-3">
          {isWordExport ? (
            <a
              className={cx(
                'h-10 border-primary text-[15px]',
                exportButtonClassname,
              )}
              href={formatApiUrl(
                `/api/projects/v2/export?project_id=${projectId}&output_format=docx`,
              )}
              onClick={closeModal}
            >
              Download project summary
            </a>
          ) : (
            <a
              className={cx(
                'h-10 border-primary text-[15px]',
                exportButtonClassname,
              )}
              href={formatApiUrl(
                `/api/projects/v2/export?project_id=${projectId}`,
              )}
              onClick={closeModal}
            >
              Download Excel
            </a>
          )}
          <CancelButton onClick={closeModal} className="border-primary" />
        </div>
      </Box>
    </Modal>
  )
}

export default ExportConfirmModal
