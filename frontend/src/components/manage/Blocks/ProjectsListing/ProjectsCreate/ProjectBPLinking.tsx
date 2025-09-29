import { ChangeEvent } from 'react'

import LinkedBPTableWrapper from './LinkedBPTable'
import { NextButton } from '../HelperComponents'
import { SectionTitle } from './ProjectsCreate'
import { ProjectDataProps, ProjectTabSetters } from '../interfaces'

import { Checkbox, FormControlLabel } from '@mui/material'
import cx from 'classnames'

const ProjectBPLinking = ({
  projectData,
  setProjectData,
  isDisabled,
  setCurrentTab,
  canEditApprovedProj,
}: Omit<ProjectDataProps, 'hasSubmitted'> &
  ProjectTabSetters & {
    canEditApprovedProj: boolean
    isDisabled: boolean
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

  return (
    <div className={cx({ 'pointer-events-none opacity-50': isDisabled })}>
      <SectionTitle>Business Plan</SectionTitle>
      <FormControlLabel
        label="The proposal is included in a BP"
        control={
          <Checkbox
            checked={isLinkedToBP}
            onChange={handleChangeBPLink}
            size="small"
            sx={{
              color: 'black',
            }}
          />
        }
        componentsProps={{
          typography: { fontSize: '1.05rem' },
        }}
      />
      {isLinkedToBP && (
        <LinkedBPTableWrapper {...{ projectData, setProjectData }} />
      )}
      {canEditApprovedProj && (
        <div className="mt-5">
          <NextButton
            nextStep={2}
            setCurrentTab={setCurrentTab}
            isBtnDisabled={isDisabled}
          />
        </div>
      )}
    </div>
  )
}

export default ProjectBPLinking
