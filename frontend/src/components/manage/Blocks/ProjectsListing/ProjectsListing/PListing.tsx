'use client'

import { useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import ExpandableMenu from './ExpandableMenu'
import GenerateDBMenu from './GenerateDBMenu'
import PListingFilters from './PListingFilters'
import PListingTable from './PListingTable'
import { useGetProjects } from '../hooks/useGetProjects'
import { PROJECTS_PER_PAGE } from '../constants'
import { useStore } from '@ors/store'

import { Modal, Typography, Button, Box } from '@mui/material'
import { LuCopy } from 'react-icons/lu'
import { IoIosLink } from 'react-icons/io'
import cx from 'classnames'

const menus = [
  {
    title: 'Planning',
    menuItems: [
      { title: 'View business plans', url: '/business-plans' },
      { title: 'New business plan', url: '/business-plans/upload' },
    ],
  },
  {
    title: 'Approved Projects',
    menuItems: [
      { title: 'Update MYA data', url: null },
      { title: 'Update post ExCom fields', url: null },
      { title: 'Update enterprises', url: null },
      { title: 'Transfer a project', url: null },
    ],
  },
  {
    title: 'Reporting',
    menuItems: [
      { title: 'Create Annual Progress Report', url: null },
      { title: 'Raise a PCR', url: null },
    ],
  },
]

export default function PListing() {
  const form = useRef<any>()

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  const initialFilters = {
    offset: 0,
    limit: PROJECTS_PER_PAGE,
    ordering: '-date_created',
  }

  const projects = useGetProjects(initialFilters)
  const { loading, setParams } = projects

  const [projectData, setProjectData] = useState<{
    projectId: number | null
    projectTitle: string
  }>({
    projectId: null,
    projectTitle: '',
  })
  const { projectId, projectTitle } = projectData
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false)
  const [filters, setFilters] = useState({ ...initialFilters })
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const projectActions = (
    <div className="flex flex-wrap items-center gap-3">
      {user_permissions.includes('add_project') && (
        <div
          className={cx('flex cursor-pointer gap-1 px-2 no-underline', {
            'flex !cursor-default gap-1 px-2 text-gray-400 opacity-60':
              !projectId,
          })}
          onClick={() => setIsCopyModalOpen(true)}
        >
          <LuCopy className="mb-1" size={18} />
          Copy project
        </div>
      )}
      <div
        className={cx('flex cursor-pointer gap-1 px-2 no-underline', {
          'flex !cursor-default gap-1 px-2 text-gray-400 opacity-60':
            !projectId,
        })}
      >
        <IoIosLink className="mb-1" size={18} />
        Associate project
      </div>
      <GenerateDBMenu />
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
          <Button
            className="h-10 border border-solid border-[#F2F2F2] bg-[#F2F2F2] px-4 py-2 text-[#4D4D4D] shadow-none hover:border-primary hover:bg-[#F2F2F2] hover:text-[#4D4D4D]"
            color="primary"
            size="large"
            variant="contained"
            onClick={() => setIsCopyModalOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </Box>
    </Modal>
  )

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <div className="mt-5 flex flex-wrap justify-between gap-y-3">
        <div className="flex flex-wrap gap-x-2 gap-y-3">
          {menus.map((menu) => (
            <ExpandableMenu menu={menu} />
          ))}
        </div>
        {user_permissions.includes('add_project') && (
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
        <form className="flex flex-col gap-6" ref={form} key={key}>
          <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
            <PListingFilters
              {...{ form, filters, initialFilters, setFilters, setParams }}
            />
            {projectActions}
          </div>
          <PListingTable
            {...{ projects, filters, projectId, setProjectData }}
          />
        </form>
        {isCopyModalOpen && copyProjectModal}
      </Box>
    </>
  )
}
