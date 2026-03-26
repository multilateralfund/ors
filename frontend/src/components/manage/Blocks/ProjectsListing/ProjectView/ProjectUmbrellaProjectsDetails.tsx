import { useContext, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectRelatedProjects from './ProjectRelatedProjects'
import ProjectMyaUpdate from './ProjectMyaUpdate'
import { ErrorsList, NavigationButton } from '../HelperComponents'
import { MetaProjectDetailType } from '../UpdateMyaData/types'
import { formatErrors, hasSectionErrors } from '../utils'
import {
  ProjectTabSetters,
  ProjectTypeApi,
  RelatedProjectsSectionType,
  InlineMessageType,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { useStore } from '@ors/store'

import { Tabs, Tab } from '@mui/material'

const ProjectUmbrellaProjectDetails = ({
  relatedProjects,
  setCurrentTab,
  metaProjectId,
  setMetaProjectId,
  setRefetchRelatedProjects,
  canDisassociate,
  mode,
  isMya,
  isPrevButtonDisabled,
  ...rest
}: ProjectTabSetters & {
  project?: ProjectTypeApi
  relatedProjects: RelatedProjectsSectionType[]
  metaProjectId?: number | null
  setMetaProjectId?: (id: number | null) => void
  setRefetchRelatedProjects?: (refetch: boolean) => void
  canDisassociate?: boolean
  metaprojectData: MetaProjectDetailType | null
  mode: string
  isMya: boolean
  isPrevButtonDisabled?: boolean
  setInlineMessage: (message: InlineMessageType) => void
}) => {
  const { canViewMetaProjects } = useContext(PermissionsContext)
  const { allMpErrors } = useStore((state) => state.mpData)
  const [crtTab, setCrtTab] = useState<number>(0)

  const steps = [
    {
      id: 'related-projects',
      label: 'Components/Associated projects',
      component: (
        <ProjectRelatedProjects
          {...{
            relatedProjects,
            metaProjectId,
            setMetaProjectId,
            setRefetchRelatedProjects,
            canDisassociate,
            mode,
            isMya,
            ...rest,
          }}
        />
      ),
    },
    ...(canViewMetaProjects && isMya
      ? [
          {
            id: 'mya-updates',
            label: (
              <div className="relative flex items-center justify-between gap-x-2">
                <div className="leading-tight">MYA updates</div>
                {hasSectionErrors(allMpErrors) && (
                  <SectionErrorIndicator errors={[]} />
                )}
              </div>
            ),
            component: <ProjectMyaUpdate {...{ mode, ...rest }} />,
            errors: formatErrors(allMpErrors),
          },
        ]
      : []),
  ]

  return (
    <>
      <Tabs
        aria-label="umbrella-project-details"
        value={crtTab}
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        onChange={(_, newValue) => {
          setCrtTab(newValue)
        }}
      >
        {steps.map(({ id, label }) => (
          <Tab key={id} aria-controls={id} {...{ id, label }} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {steps
          .filter((_, index) => index === crtTab)
          .map(({ id, component, errors }) => (
            <span key={id}>
              {errors && errors.length > 0 && <ErrorsList {...{ errors }} />}
              {component}
            </span>
          ))}
      </div>
      {setCurrentTab && (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <NavigationButton
            type="previous"
            setCurrentTab={setCurrentTab}
            isBtnDisabled={isPrevButtonDisabled}
          />
          {mode === 'edit' && <NavigationButton {...{ setCurrentTab }} />}
        </div>
      )}
    </>
  )
}

export default ProjectUmbrellaProjectDetails
