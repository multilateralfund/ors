import { useEffect, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../HelperComponents'
import { useGetProjectsForSubmission } from '../hooks/useGetProjectsForSubmission'
import { ProjectTypeApi, RelatedProjectsType } from '../interfaces'
import { pluralizeWord } from '../utils'

import { Modal, Typography, Box, Divider } from '@mui/material'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { debounce, map } from 'lodash'

const SubmitProjectModal = ({
  id,
  isModalOpen,
  setIsModalOpen,
  editProject,
}: {
  id: number
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  editProject: (withNavigation: boolean) => void
}) => {
  const [associatedProjects, setAssociatedProjects] = useState<
    RelatedProjectsType[] | null
  >([])
  const [loaded, setLoaded] = useState<boolean>(false)

  const hasAssociatedPojects =
    associatedProjects && associatedProjects.length > 0

  const debouncedGetProjectsForSubmission = debounce(() => {
    useGetProjectsForSubmission(id, setAssociatedProjects, setLoaded)
  }, 0)

  useEffect(() => {
    debouncedGetProjectsForSubmission()
  }, [])

  const onEditProject = () => {
    editProject(true)
    setIsModalOpen(false)
  }

  return (
    <div key={JSON.stringify(associatedProjects)}>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!loaded}
      />
      <Modal
        aria-labelledby="submit-modal"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        keepMounted
      >
        <Box className="flex w-full max-w-lg flex-col px-0 absolute-center md:max-w-2xl">
          <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
            Submit project
          </Typography>
          <div className="mb-4 flex flex-col gap-6 bg-[#F5F5F5] p-6">
            <div className="flex flex-col">
              <span className="text-lg">
                {hasAssociatedPojects
                  ? `Together with this project, you will be submitting the following ${pluralizeWord(associatedProjects, 'project')}:`
                  : 'You are submitting this project to the MLFS.'}
              </span>
            </div>
            {hasAssociatedPojects && (
              <div className="flex flex-col rounded-lg bg-white p-4">
                {map(
                  associatedProjects,
                  (project: ProjectTypeApi, index: number) => (
                    <div key={project.id}>
                      <span className="flex items-center gap-2 text-lg normal-case leading-tight !text-inherit">
                        <FaExternalLinkAlt
                          size={16}
                          className="min-h-[16px] min-w-[16px]"
                        />
                        {project.title}
                      </span>
                      {index !== associatedProjects.length - 1 && (
                        <Divider className="my-3" />
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
            <span className="text-lg">
              {hasAssociatedPojects
                ? `Please ensure ${associatedProjects.length > 1 ? 'these projects are' : 'this project is'} complete and ready to be submitted to the Secretariat.`
                : 'Are you sure there are no other components or associated projects which need to be submitted together with this one?'}
            </span>
          </div>
          <div className="ml-auto mr-6 flex flex-wrap gap-3">
            <CustomLink
              className="h-10 px-4 py-2 text-lg uppercase"
              onClick={onEditProject}
              href={null}
              color="secondary"
              variant="contained"
              button
            >
              {hasAssociatedPojects
                ? 'Submit associated projects'
                : 'Submit project'}
            </CustomLink>
            <CancelButton onClick={() => setIsModalOpen(false)} />
          </div>
        </Box>
      </Modal>
    </div>
  )
}

export default SubmitProjectModal
