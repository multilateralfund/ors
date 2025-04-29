import { ChangeEvent } from 'react'

import LinkedBPTableWrapper from './LinkedBPTable'

import { Checkbox, FormControlLabel } from '@mui/material'

const ProjectBPLinking = ({ isLinkedToBP, setIsLinkedToBP, ...rest }: any) => {
  const handleChangeBPLink = (event: ChangeEvent<HTMLInputElement>) => {
    setIsLinkedToBP(event.target.checked)
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
      {isLinkedToBP && <LinkedBPTableWrapper {...rest} />}
    </>
  )
}

export default ProjectBPLinking
