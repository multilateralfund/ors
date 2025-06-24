import BPDetailsConsolidatedEdit from './BPEditConsolidated/BPDetailsConsolidatedEdit'
import BPDetails from './BP/BPDetails'
import { BPTabsInterface } from './types'
import { useStore } from '@ors/store'

import { Tab, Tabs } from '@mui/material'

const BPTabs = ({
  activeTab,
  children,
  setActiveTab,
  isConsolidatedBp = false,
  ...props
}: BPTabsInterface) => {
  const { setActiveTab: setActiveTabStore } = useStore(
    (state) => state.bp_current_tab,
  )

  return (
    <>
      <div className="flex items-center justify-between gap-2 lg:flex-nowrap print:hidden">
        <Tabs
          aria-label="view bp"
          value={activeTab}
          className="sectionsTabs w-96"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          onChange={(_, newValue) => {
            setActiveTab(newValue)
            setActiveTabStore(newValue)
          }}
        >
          <Tab
            id="business-plan-details"
            aria-controls="business-plan-details"
            label="Report Info"
          />
          <Tab
            id="business-plan-activities"
            aria-controls="business-plan-activities"
            label="Activities"
          />
        </Tabs>
        <div id="bp-table-export-button" className="mb-1.5 self-end" />
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {activeTab === 0 &&
          (isConsolidatedBp ? (
            <BPDetailsConsolidatedEdit {...props} />
          ) : (
            <BPDetails {...props} />
          ))}
        {activeTab === 1 && children}
      </div>
    </>
  )
}

export default BPTabs
