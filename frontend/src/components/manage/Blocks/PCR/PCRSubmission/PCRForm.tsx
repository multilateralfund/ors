import { useContext, useMemo, useState } from 'react'

import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRGenderMainstreaming from './PCRGenderMainstreaming'
import PCRResultsAssessment from './PCRResultsAssessment'
import PCRSummaryOfKeyData from './PCRSummaryOfKeyData'
import PCRLessonsLearned from './PCRLessonsLearned'
import PCRCausesOfDelay from './PCRCausesOfDelay'
import PCROverview from './PCROverview'
import PCRSdgs from './PCRSdgs'

import { Tabs, Tab } from '@mui/material'
import { reduce } from 'lodash'

const PCRForm = () => {
  const { pcrMetaproject, PCRData } = useContext(PCRDataContext)
  const { data: metaproject } = pcrMetaproject
  const projects = metaproject?.projects ?? []

  const [currentTab, setCurrentTab] = useState<number>(0)

  const fundsByAgency = useMemo(() => {
    const projectAgencyMap = reduce(
      projects,
      (acc, project) => {
        acc[project.id] = project.agency_id
        return acc
      },
      {} as Record<number, number>,
    )

    const mlf_funding_approved = reduce(
      projects,
      (acc, project) => {
        const agencyId = project.agency_id

        acc[agencyId] =
          (acc[agencyId] || 0) + Number(project.funds_approved || 0)

        return acc
      },
      {} as Record<number, number>,
    )

    const total_mlf_funding_approved = reduce(
      mlf_funding_approved,
      (acc, fundApproved) => acc + fundApproved,
      0,
    )

    const mlf_funding_disbursed = reduce(
      PCRData.summary_of_key_data,
      (acc, entry) => {
        const agencyId = projectAgencyMap[entry.project_id]

        if (agencyId) {
          acc[agencyId] =
            (acc[agencyId] || 0) + Number(entry.funds_disbursed || 0)
        }

        return acc
      },
      {} as Record<number, number>,
    )

    const total_mlf_funding_disbursed = reduce(
      mlf_funding_disbursed,
      (acc, fundDisbursed) => acc + fundDisbursed,
      0,
    )

    const mlf_funding_returned = reduce(
      mlf_funding_approved,
      (acc, fundApproved, agencyId) => {
        acc[Number(agencyId)] =
          fundApproved - (mlf_funding_disbursed[Number(agencyId)] || 0)

        return acc
      },
      {} as Record<number, number>,
    )

    const total_mlf_funding_returned = reduce(
      mlf_funding_returned,
      (acc, fundReturned) => acc + fundReturned,
      0,
    )

    return {
      mlf_funding_approved,
      mlf_funding_disbursed,
      mlf_funding_returned,
      total_mlf_funding_approved,
      total_mlf_funding_disbursed,
      total_mlf_funding_returned,
    }
  }, [projects, PCRData.summary_of_key_data])

  const TabLabel = ({ title }: { title: string }) => (
    <div className="relative flex items-center justify-between gap-x-2">
      <div className="leading-tight">{title}</div>
    </div>
  )

  const tabs = [
    {
      id: 'pcr-overview',
      label: <TabLabel title="Overview" />,
      component: <PCROverview {...{ fundsByAgency }} />,
    },
    {
      id: 'pcr-summary-of-key-data',
      label: <TabLabel title="Summary of key data (tranches)" />,
      component: <PCRSummaryOfKeyData />,
    },
    {
      id: 'pcr-results-assessment',
      label: <TabLabel title="Project results overall assessment" />,
      component: <PCRResultsAssessment />,
    },
    {
      id: 'pcr-causes-of-delay',
      label: <TabLabel title="Causes of delay" />,
      component: <PCRCausesOfDelay />,
    },
    {
      id: 'pcr-lessons-learned',
      label: <TabLabel title="Lessons learned" />,
      component: <PCRLessonsLearned />,
    },
    {
      id: 'pcr-gender-mainstreaming',
      label: <TabLabel title="Gender mainstreaming" />,
      component: <PCRGenderMainstreaming />,
    },
    {
      id: 'pcr-sdgs',
      label: <TabLabel title="SDGs (optional)" />,
      component: <PCRSdgs />,
    },
    {
      id: 'pcr-supporting-evidence',
      label: <TabLabel title="Other supporting evidence" />,
      component: <>Other supporting evidence</>,
    },
  ]

  return (
    <>
      <Tabs
        aria-label="pcr-form"
        className="sectionsTabs pcrTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        value={currentTab}
        onChange={(_, newValue) => {
          setCurrentTab(newValue)
        }}
      >
        {tabs.map(({ id, label }) => (
          <Tab key={id} aria-controls={id} {...{ id, label }} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {tabs
          .filter((_, index) => index === currentTab)
          .map(({ id, component }) => (
            <span key={id}>
              {component}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                {currentTab !== 0 && (
                  <NavigationButton
                    type="previous"
                    setCurrentTab={setCurrentTab}
                  />
                )}
                {currentTab !== tabs.length - 1 && (
                  <NavigationButton setCurrentTab={setCurrentTab} />
                )}
              </div>
            </span>
          ))}
      </div>
    </>
  )
}

export default PCRForm
