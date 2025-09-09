'use client'

import { useContext, useState } from 'react'

import TableViewSelector from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableViewSelector'
import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import CustomLink from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PListingAssociation from './PListingAssociation'
import PListingProjects from './PListingProjects'
import ExpandableMenu from './ExpandableMenu'
import GenerateDBMenu from './GenerateDBMenu'
import { CancelButton } from '../HelperComponents'
import { ListingProjectData } from '../interfaces'
import { getMenus } from '../utils'

import { Modal, Typography, Box } from '@mui/material'
import { IoIosLink } from 'react-icons/io'
import { LuCopy } from 'react-icons/lu'
import cx from 'classnames'

export default function PListingWrapper() {
  const {
    canViewBp,
    canUpdateBp,
    canViewProjects,
    canUpdateProjects,
    canAssociateProjects,
  } = useContext(PermissionsContext)

  const [view, setView] = useState<ViewSelectorValuesType>('list')
  const [projectData, setProjectData] = useState<ListingProjectData>({
    projectId: null,
    projectTitle: '',
    projectSubmissionStatus: '',
  })
  const { projectId, projectTitle } = projectData
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false)

  const projectActions = (
    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-4">
      {canUpdateProjects && (
        <div
          className={cx('flex cursor-pointer gap-1 px-2 no-underline', {
            '!cursor-default text-gray-400 opacity-60': !projectId,
          })}
          onClick={() => {
            if (projectId) {
              setIsCopyModalOpen(true)
            }
          }}
        >
          <LuCopy className="mb-1" size={18} />
          Copy project
        </div>
      )}
      {canAssociateProjects && (
        <CustomLink
          href={projectId ? `/projects-listing/${projectId}/associate` : null}
          className={cx('flex cursor-pointer gap-1 px-2 no-underline', {
            '!cursor-default text-gray-400 opacity-60': !projectId,
          })}
        >
          <IoIosLink className="mb-1" size={18} />
          Associate project
        </CustomLink>
      )}
      <GenerateDBMenu />
    </div>
  )

  const tableToolbar = (
    <div className="flex flex-wrap gap-3">
      {projectActions}
      <TableViewSelector
        value={view}
        reverseViewOrder={true}
        tooltipText={['List projects', 'List associated projects']}
        changeHandler={(_, value) => {
          setView(value)
        }}
      />
    </div>
  )

  const copyProjectModal = (
    <Modal
      aria-labelledby="copy-modal-title"
      open={isCopyModalOpen}
      onClose={() => setIsCopyModalOpen(false)}
      keepMounted
    >
      <Box className="flex w-full max-w-lg flex-col px-0 absolute-center">
        <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
          Copy project
        </Typography>
        <div className="mb-4 flex flex-col gap-2.5 bg-[#F5F5F5] p-6">
          <span className="text-lg">
            You are about to copy the following project and start a new
            submission.
          </span>
          <span className="text-lg font-semibold">{projectTitle}</span>
        </div>
        <div className="ml-auto mr-6 flex gap-3">
          <CustomLink
            className="h-10 px-4 py-2 text-lg uppercase"
            href={`/projects-listing/create/${projectId}/copy`}
            color="secondary"
            variant="contained"
            button
          >
            Copy Project
          </CustomLink>
          <CancelButton onClick={() => setIsCopyModalOpen(false)} />
        </div>
      </Box>
    </Modal>
  )

  return (
    <>
      <div className="mt-5 flex flex-wrap justify-between gap-y-3">
        <div className="mb-2 flex flex-wrap gap-x-2 gap-y-3">
          {getMenus(
            { canViewBp, canUpdateBp, canViewProjects },
            projectData,
          ).map((menu) => (
            <ExpandableMenu menu={menu} />
          ))}
        </div>
        {canUpdateProjects && (
          <CustomLink
            className="mb-4 h-10 min-w-[6.25rem] text-nowrap px-4 py-2 text-lg uppercase"
            href="/projects-listing/create"
            color="secondary"
            variant="contained"
            button
          >
            New Project Submission
          </CustomLink>
        )}
      </div>
      <Box className="shadow-none">
        {view === 'list' ? (
          <PListingProjects
            {...{
              projectId,
              setProjectData,
              tableToolbar,
            }}
          />
        ) : (
          <PListingAssociation
            {...{
              projectId,
              setProjectData,
              tableToolbar,
            }}
          />
        )}
        {isCopyModalOpen && copyProjectModal}
      </Box>
    </>
  )
}
