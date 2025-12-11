import { useState, useContext } from 'react'
import {
  PageTitle,
  RedirectBackButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'

import { useGetProject } from '../hooks/useGetProject'

import { Box } from '@mui/material'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput.tsx'
import {
  useMeetingOptions,
  getFilterOptions,
} from '@ors/components/manage/Utils/utilFunctions.ts'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import Field from '@ors/components/manage/Form/Field.tsx'
import { IoChevronDown } from 'react-icons/io5'
import { union } from 'lodash'

const defaultProps = {
  FieldProps: { className: 'mb-0 w-full' },
  popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
  getOptionLabel: (option: any) => option?.name,
  componentsProps: {
    popupIndicator: {
      sx: {
        transform: 'none !important',
      },
    },
  },
}

const Filters = (props: any) => {
  const { requestParams, setRequestParams } = props

  const meetings = useMeetingOptions()
  const { agencies } = useContext(ProjectsDataContext)

  return (
    <Box className="shadow-none">
      <div className="flex w-full gap-4">
        <div className="w-full md:w-[7.76rem]">
          <Label htmlFor="meetingPopover">Meeting</Label>
          <PopoverInput
            id="meetingPopover"
            className="!m-0 mb-0 h-[2.25rem] min-h-[2.25rem] w-full truncate border-2 !py-1 !pr-0 text-[16px] md:w-[7.76rem]"
            label={
              meetings.filter((o) => o.value === requestParams.meeting_id)[0]
                ?.label ?? ''
            }
            options={meetings}
            withClear={true}
            onChange={(value: string) => {
              setRequestParams((prev) => ({
                ...prev,
                meeting_id: value ?? '',
              }))
            }}
            onClear={() => {
              setRequestParams((prev) => ({
                ...prev,
                meeting_id: '',
              }))
            }}
          />
        </div>
        <div className="w-full md:w-[14rem]">
          <Label htmlFor="agencySelection">Agency</Label>
          <Field
            Input={{ placeholder: 'Click to select', id: 'agencySelection' }}
            options={agencies}
            value={
              agencies.filter(
                (o) => o.id === parseInt(requestParams.agency_id, 10),
              )[0] ?? null
            }
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              setRequestParams((prev) => ({
                ...prev,
                agency_id: value?.id.toString() ?? '',
              }))
            }}
            {...defaultProps}
          />
        </div>
      </div>
    </Box>
  )
}

const ProjectCompareVersions = ({ project }: { project: any }) => {
  const [requestParams, setRequestParams] = useState({
    meeting_id: '',
    agency_id: '',
  })

  return (
    <>
      <Filters
        requestParams={requestParams}
        setRequestParams={setRequestParams}
      />
    </>
  )
}

const ProjectCompareVersionsWrapper = ({
  project_id,
}: {
  project_id: string
}) => {
  const { loading, data: project } = useGetProject(project_id)

  return (
    <>
      <HeaderTitle>
        <RedirectBackButton />
        <PageHeading className="min-w-fit">
          <PageTitle
            pageTitle="Compare versions"
            projectTitle={project?.title ?? '...'}
          />
        </PageHeading>
      </HeaderTitle>
      {!loading && project ? (
        <ProjectCompareVersions project={project} />
      ) : null}
    </>
  )
}

export default ProjectCompareVersionsWrapper
