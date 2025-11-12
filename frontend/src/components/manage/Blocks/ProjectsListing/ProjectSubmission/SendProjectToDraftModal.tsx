import { useEffect, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton, RelatedProjects } from '../HelperComponents'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { AssociatedProjectsType } from '../interfaces'
import { pluralizeWord } from '../utils'

import { Modal, Typography, Box, CircularProgress } from '@mui/material'
import { debounce } from 'lodash'

const SendProjectToDraftModal = ({
  id,
  isLoading,
  isModalOpen,
  setIsModalOpen,
  onAction,
}: {
  id: number
  isLoading: boolean
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  onAction: () => void
}) => {
  const [association, setAssociation] = useState<AssociatedProjectsType>({
    projects: [],
    loaded: false,
  })
  const { projects: associatedProjects = [], loaded } = association
  const hasAssociatedPojects =
    associatedProjects && associatedProjects.length > 0

  const debouncedGetAssociatedProjects = debounce(() => {
    useGetAssociatedProjects(id, setAssociation, 'only_components')
  }, 0)

  useEffect(() => {
    debouncedGetAssociatedProjects()
  }, [])

  return (
    <div key={JSON.stringify(associatedProjects)}>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!loaded}
      />
      <Modal
        aria-labelledby="send-back-to-draft-modal"
        open={isModalOpen && loaded}
        onClose={() => setIsModalOpen(false)}
        keepMounted
      >
        <Box className="flex w-full max-w-lg flex-col px-0 absolute-center md:max-w-2xl">
          <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
            Send project back to draft
          </Typography>
          <div className="mb-4 flex flex-col gap-6 bg-[#F5F5F5] p-6">
            <div className="flex flex-col">
              <span className="text-lg">
                {hasAssociatedPojects
                  ? `Together with this project, you will be sending the following ${pluralizeWord(associatedProjects, 'project')} back to draft:`
                  : 'You are sending this project back to draft.'}
              </span>
            </div>
            {hasAssociatedPojects && (
              <div className="flex flex-col rounded-lg bg-white p-4">
                <RelatedProjects
                  data={associatedProjects}
                  isLoaded={loaded}
                  canRefreshStatus={false}
                />
              </div>
            )}
            <span className="text-lg">
              {hasAssociatedPojects
                ? `Please ensure ${associatedProjects.length > 1 ? 'these projects are' : 'this project is'} ready to be sent back to draft.`
                : 'Are you sure there are no other components or associated projects which need to be sent back to draft together with this one?'}
            </span>
          </div>
          <div className="ml-auto mr-6 flex flex-wrap gap-3">
            <CustomLink
              className="h-10 px-4 py-2 text-lg uppercase"
              onClick={onAction}
              href={null}
              color="secondary"
              variant="contained"
              button
            >
              {hasAssociatedPojects
                ? `Send ${pluralizeWord(associatedProjects, 'project')} back to draft`
                : 'Send project back to draft'}
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
    </div>
  )
}

export default SendProjectToDraftModal
