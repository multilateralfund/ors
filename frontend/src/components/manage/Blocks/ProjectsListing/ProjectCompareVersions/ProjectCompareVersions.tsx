import { useState, useContext, useMemo, FormEventHandler } from 'react'
import {
  PageTitle,
  RedirectBackButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'

import { useGetProject } from '../hooks/useGetProject'

import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from '@mui/material'
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
import FormControl from '@mui/material/FormControl'
import {
  ProjectTypeApi,
  ProjectVersions,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { SubmitButton } from '@ors/components/ui/Button/Button.tsx'
import { formatApiUrl } from '@ors/helpers'

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

const Filters = (props: { project: ProjectTypeApi }) => {
  const { project } = props
  const [selected, setSelected] = useState<Record<any, boolean>>({})
  const selectedCount = useMemo(() => {
    return Object.entries(selected).filter(([k, v]) => v).length
  }, [selected])

  return (
    <Box className="shadow-none">
      <div className="flex w-full gap-4">
        <form
          action={formatApiUrl(
            `/api/projects/v2/${project.id}/compare-versions`,
          )}
          method="GET"
        >
          <FormControl>
            <FormLabel>Select versions for comparison</FormLabel>
            <FormGroup>
              {project.versions.map((v: ProjectVersions) => {
                let label
                if (v.version > 3) {
                  label = `${v.version}: Updated after ExCom ${v.post_excom_meeting}`
                } else {
                  label = `${v.version}: ${v.submission_status} (Meeting ${v.meeting})`
                }
                label = `Version ${label}`
                return (
                  <FormControlLabel
                    key={v.id}
                    control={<Checkbox />}
                    value={v.id}
                    disabled={selectedCount >= 2 && !selected[v.id]}
                    label={label}
                    name="project_id"
                    onChange={(evt: any) =>
                      setSelected((prev) => ({
                        ...prev,
                        [evt.target.value]: evt.target.checked,
                      }))
                    }
                  />
                )
              })}
            </FormGroup>
          </FormControl>
          <SubmitButton>Generate report</SubmitButton>
        </form>
      </div>
    </Box>
  )
}

const ProjectCompareVersions = ({ project }: { project: any }) => {
  return (
    <>
      <Filters project={project} />
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
            projectTitle={
              project?.title ? `${project.title} (${project.code})` : '...'
            }
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
