import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../../HelperComponents'
import { api } from '@ors/helpers'

import { Typography, Box, Modal } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'

const DeleteEnterpriseModal = ({
  mode,
  idToDelete,
  setIdToDelete,
  setParams,
  showWarning,
  setShowWarning,
}: {
  mode: string
  idToDelete: number | null
  setIdToDelete?: (id: number | null) => void
  setParams?: any
  showWarning?: boolean
  setShowWarning?: (showWarning: boolean) => void
}) => {
  const [_, setLocation] = useLocation()

  const isViewMode = mode === 'view'

  const handleDeleteEnterprise = async () => {
    try {
      await api(`api/enterprises/${idToDelete}`, {
        method: 'DELETE',
      })

      enqueueSnackbar(<>Deleted enterprise successfully.</>, {
        variant: 'success',
      })

      if (isViewMode) {
        setLocation('/projects-listing/enterprises')
      } else {
        setParams?.((prev: any) => ({ ...prev }))
      }
    } catch (error) {
      enqueueSnackbar(<>Could not delete enterprise. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      if (!isViewMode) {
        setIdToDelete?.(null)
      }
    }
  }

  const handleCloseModal = () => {
    if (isViewMode) {
      setShowWarning?.(false)
    } else {
      setIdToDelete?.(null)
    }
  }

  return (
    <Modal
      aria-labelledby="delete-enterprise-modal"
      open={isViewMode ? !!showWarning : !!idToDelete}
      onClose={handleCloseModal}
      keepMounted
    >
      <Box className="flex w-full max-w-[90%] flex-col gap-4 absolute-center md:max-w-lg">
        <Typography className="text-[20px] font-medium text-black">
          Delete enterprise
        </Typography>
        <Typography className="text-lg text-primary">
          Are you sure you want to delete this enterprise?
        </Typography>
        <div className="flex flex-wrap justify-end gap-3">
          <CustomLink
            className="h-10 py-2 text-lg"
            variant="contained"
            color="secondary"
            href={null}
            onClick={handleDeleteEnterprise}
            button
          >
            Delete enterprise
          </CustomLink>
          <CancelButton onClick={handleCloseModal} />
        </div>
      </Box>
    </Modal>
  )
}

export default DeleteEnterpriseModal
