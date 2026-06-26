import { useContext, useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  RedirectBackButton,
  CreateButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PCRFiltersWrapper from './PCRFiltersWrapper'
import PCRTable from './PCRTable'
import { useGetPCRFilters } from '../hooks/useGetPCRFilters'
import { useGetPCRs } from '../hooks/useGetPCRs'

import { Tabs, Tab } from '@mui/material'
import { Redirect } from 'wouter'

export default function PCRWrapper() {
  const { canViewPCR, canEditPCR } = useContext(PermissionsContext)

  const form = useRef<any>()

  const initialFilters = {
    offset: 0,
    limit: 100,
  }
  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const [currentTab, setCurrentTab] = useState<number>(0)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  )

  const pcrs = useGetPCRs(initialFilters)
  const { loading, setParams } = pcrs
  const PCRFiltersOpts = useGetPCRFilters(filters)

  const steps = [
    {
      id: 'projects-tab',
      label: 'Projects',
      component: (
        <div className="flex flex-col gap-6" key={key}>
          <PCRFiltersWrapper
            {...{
              form,
              filters,
              initialFilters,
              setFilters,
              setParams,
              PCRFiltersOpts,
            }}
          />
          <PCRTable {...{ pcrs, selectedProjectId, setSelectedProjectId }} />
        </div>
      ),
    },
    {
      id: 'submissions-tab',
      label: 'IA/BA Submissions',
      component: (
        <PCRTable {...{ pcrs, selectedProjectId, setSelectedProjectId }} />
      ),
    },
  ]

  if (!canViewPCR) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <RedirectBackButton />
            <PageHeading>Project Completion Reports</PageHeading>
          </div>
          {canEditPCR && (
            <div className="ml-auto mt-auto flex items-center">
              <CreateButton
                title="Create PCR"
                href={`/pcr/${selectedProjectId}/create`}
                disabled={!selectedProjectId}
                className="!mb-0"
              />
            </div>
          )}
        </div>
      </HeaderTitle>
      <Tabs
        aria-label="pcr-listing"
        value={currentTab}
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        onChange={(_, newValue) => {
          setCurrentTab(newValue)
        }}
      >
        {steps.map(({ id, label }) => (
          <Tab key={id} id={id} aria-controls={id} label={label} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {steps
          .filter((_, index) => index === currentTab)
          .map(({ id, component }) => (
            <span key={id}>{component}</span>
          ))}
      </div>
    </>
  )
}
