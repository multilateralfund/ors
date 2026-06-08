import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import PCROverviewUserInputData from './PCROverviewUserInputData'
import { PCRSectionsProps } from '../interfaces'

import { Divider } from '@mui/material'

const PCROverviewSection = ({
  PCRData,
  setPCRData,
  setCurrentTab,
  errors,
}: PCRSectionsProps) => {
  return (
    <>
      <PCROverviewPrefilledData {...{ PCRData, setPCRData, errors }} />
      <Divider className="my-6" />
      <PCROverviewUserInputData {...{ PCRData, setPCRData, errors }} />
      <div className="mt-5">
        <NavigationButton setCurrentTab={setCurrentTab} />
      </div>
    </>
  )
}

export default PCROverviewSection
