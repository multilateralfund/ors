import { ChangeEvent } from 'react'

import LinkedBPTableWrapper from './LinkedBPTable'
import { NavigationButton } from '../HelperComponents'
import { SectionTitle } from './ProjectsCreate'
import { BpDataProps, ProjectDataProps, ProjectTabSetters } from '../interfaces'

import { Checkbox, FormControlLabel } from '@mui/material'
import cx from 'classnames'

const ProjectBPLinking = ({
  projectData,
  setProjectData,
  isSectionDisabled,
  isNextButtonDisabled,
  setCurrentTab,
  bpData,
  onBpDataChange,
}: Omit<ProjectDataProps, 'hasSubmitted'> &
  ProjectTabSetters & {
    isSectionDisabled: boolean
    isNextButtonDisabled: boolean
    bpData: BpDataProps
    onBpDataChange: (bpData: BpDataProps) => void
  }) => {
  const { isLinkedToBP } = projectData.bpLinking

  const handleChangeBPLink = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectData((prevData) => {
      const { bpLinking } = prevData
      const isChecked = event.target.checked

      return {
        ...prevData,
        bpLinking: {
          ...bpLinking,
          isLinkedToBP: isChecked,
          bpId: isChecked ? bpLinking.bpId : null,
        },
      }
    })
  }

  const { country, agency, cluster } = projectData.projIdentifiers

  return (
    <>
      <div
        className={cx({ 'pointer-events-none opacity-50': isSectionDisabled })}
      >
        <SectionTitle>Business Plan</SectionTitle>
        <FormControlLabel
          label="The proposal is included in a BP"
          control={
            <Checkbox
              checked={isLinkedToBP || bpData.hasBpData}
              // onChange={handleChangeBPLink}
              size="small"
              sx={{ color: 'black' }}
            />
          }
          componentsProps={{ typography: { fontSize: '1rem' } }}
        />
        {/* {isLinkedToBP && ( */}
        {country && agency && cluster && (
          <LinkedBPTableWrapper
            {...{ projectData, setProjectData, onBpDataChange, bpData }}
          />
        )}
        {/* )} */}
      </div>
      <div className="mt-7">
        <NavigationButton
          setCurrentTab={setCurrentTab}
          isBtnDisabled={isNextButtonDisabled}
        />
      </div>
    </>
  )
}

export default ProjectBPLinking
