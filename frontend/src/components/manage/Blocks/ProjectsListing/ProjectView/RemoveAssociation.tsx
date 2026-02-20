import { useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../HelperComponents'
import { api } from '@ors/helpers'

import { Typography, Box, Modal, CircularProgress, Button } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useParams } from 'wouter'

type RemoveAssociationProps = {
  setMetaProjectId?: (id: number | null) => void
}

const RemoveAssociationModal = ({
  isModalOpen,
  setIsModalOpen,
  setMetaProjectId,
}: RemoveAssociationProps & {
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
}) => {
  const { project_id } = useParams<Record<string, string>>()
  const [isLoading, setIsLoading] = useState(false)

  const removeAssociation = async () => {
    setIsLoading(true)

    try {
      const result = await api(
        `api/projects/v2/${project_id}/remove_association/`,
        {
          method: 'POST',
        },
      )

      setMetaProjectId?.(result.meta_project_id)
      enqueueSnackbar(<>Project association removed successfully.</>, {
        variant: 'success',
      })
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
        enqueueSnackbar(<>{errors?.error}</>, { variant: 'error' })
      } else {
        enqueueSnackbar(
          <>Could not remove project association. Please try again.</>,
          { variant: 'error' },
        )
      }
    } finally {
      setIsLoading(false)
      setIsModalOpen(false)
    }
  }

  return (
    <Modal
      aria-labelledby="disassociate-modal"
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    >
      <Box className="flex w-full max-w-[90%] flex-col absolute-center md:max-w-lg">
        <Typography className="mb-4 text-[20px] font-medium text-black">
          Remove project association
        </Typography>
        <Typography className="mb-4 text-lg text-primary">
          Are you sure you want to remove the association of this project?
        </Typography>
        <div className="mr-3 flex flex-wrap justify-end gap-3">
          <CustomLink
            className="h-10 px-4 py-2 text-lg uppercase"
            onClick={removeAssociation}
            href={null}
            color="secondary"
            variant="contained"
            button
          >
            Remove association
          </CustomLink>
          <CancelButton onClick={() => setIsModalOpen(false)} />
          {isLoading && (
            <CircularProgress
              color="inherit"
              size="30px"
              className="text-align mb-1 ml-1.5 mt-auto"
            />
          )}
        </div>
      </Box>
    </Modal>
  )
}

const RemoveAssociation = (props: RemoveAssociationProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        className="mx-1.5 mb-1 h-7 w-fit whitespace-nowrap px-2 text-lg uppercase"
        size="large"
        variant="contained"
        onClick={handleOpenModal}
      >
        Remove association
      </Button>
      <RemoveAssociationModal {...{ isModalOpen, setIsModalOpen, ...props }} />
    </>
  )
}

export default RemoveAssociation
