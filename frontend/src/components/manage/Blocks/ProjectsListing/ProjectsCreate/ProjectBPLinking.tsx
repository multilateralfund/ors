import { ChangeEvent } from 'react'

import LinkedBPTableWrapper from './LinkedBPTable'
import { ProjectDataProps } from '../interfaces'

import { Checkbox, FormControlLabel } from '@mui/material'

const ProjectBPLinking = ({
  projectData,
  setProjectData,
}: Omit<ProjectDataProps, 'hasSubmitted'>) => {
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
    <>
      <FormControlLabel
        label="Is the proposal included in the BP?"
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
    </>
  )
}

export default ProjectBPLinking
