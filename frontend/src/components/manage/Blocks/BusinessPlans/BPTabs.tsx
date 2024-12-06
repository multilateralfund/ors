import { Tab, Tabs } from '@mui/material'

import BPDetails from './BP/BPDetails'
import { BPTabsInterface } from './types'
import BPDetailsConsolidatedEdit from './BPEditConsolidated/BPDetailsConsolidatedEdit'

const BPTabs = ({
  activeTab,
  children,
  setActiveTab,
  isConsolidatedBp = false,
  ...props
}: BPTabsInterface) => {
  return (
    <>
      <div className="flex items-center justify-between gap-2 lg:flex-nowrap print:hidden">
        <Tabs
          className="scrollable w-96"
          aria-label="view country programme report"
          scrollButtons="auto"
          value={activeTab}
          variant="scrollable"
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          onChange={(event, newValue) => {
            setActiveTab(newValue)
          }}
          allowScrollButtonsMobile
        >
          <Tab
            id="submissions"
            className="rounded-b-none px-3 py-2"
            aria-controls="activities"
            label="Activities"
            classes={{
              selected:
                'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
            }}
          />
          <Tab
            id="submissions-log"
            className="rounded-b-none px-3 py-2"
            aria-controls="business-plan-details"
            label="Details"
            classes={{
              selected:
                'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
            }}
          />
        </Tabs>
        <div id="bp-table-export-button" className="mb-1.5 self-end" />
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary bg-white p-6">
        {activeTab === 0 && children}
        {activeTab === 1 &&
          (isConsolidatedBp ? (
            <BPDetailsConsolidatedEdit {...props} />
          ) : (
            <BPDetails {...props} />
          ))}
      </div>
    </>
  )
}

export default BPTabs
