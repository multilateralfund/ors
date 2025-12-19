import { useEffect, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton, RelatedProjects } from '../HelperComponents'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { AssociatedProjectsType } from '../interfaces'
import { pluralizeWord } from '../utils'

import { Modal, Typography, Box } from '@mui/material'
import { capitalize, debounce } from 'lodash'
import { useLocation } from 'wouter'

const ChangeVersionModal = ({
  mode,
  id,
  isModalOpen,
  setIsModalOpen,
  editProject,
}: {
  mode: string
  id: number
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  editProject?: (navigationPage?: string) => void
}) => {
  const [_, setLocation] = useLocation()

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

  const isSubmit = mode === 'submit'
  const formatText = (termination: string) =>
    (isSubmit ? mode + 't' : mode) + termination

  const onEditProject = () => {
    if (editProject) {
      editProject(mode)
    } else {
      setLocation(`/projects/${id}/${mode}`)
    }
    setIsModalOpen(false)
  }

  return (
    <div key={JSON.stringify(associatedProjects)}>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!loaded}
      />
      <Modal
        aria-labelledby="change-version-modal"
        open={isModalOpen && loaded}
        onClose={() => setIsModalOpen(false)}
        keepMounted
      >
        <Box className="flex w-full max-w-lg flex-col px-0 absolute-center md:max-w-2xl">
          <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
            {capitalize(mode)} project
          </Typography>
          <div className="mb-4 flex flex-col gap-6 bg-[#F5F5F5] p-6">
            <div className="flex flex-col">
              <span className="text-lg">
                {hasAssociatedPojects
                  ? `Together with this project, you will be ${formatText('ing')} the following ${pluralizeWord(associatedProjects, 'project')}:`
                  : `You are ${formatText('ing')} this project${isSubmit ? ' to the MLFS' : ''}.`}
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
                ? `Please ensure ${associatedProjects.length > 1 ? 'these projects are' : 'this project is'} complete and ready to be ${formatText('ed')}${isSubmit ? ' to the Secretariat' : ''}.`
                : `Are you sure there are no other components or associated projects which need to be ${formatText('ed')} together with this one?`}
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
              {mode} project{hasAssociatedPojects ? 's' : ''}
            </CustomLink>
            <CancelButton onClick={() => setIsModalOpen(false)} />
          </div>
        </Box>
      </Modal>
    </div>
  )
}

export default ChangeVersionModal
