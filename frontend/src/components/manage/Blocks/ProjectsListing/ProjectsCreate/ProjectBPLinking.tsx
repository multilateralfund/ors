import { useState, ChangeEvent } from 'react'

import { NavigationButton } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/NavigationButton'

import { Checkbox, FormControlLabel } from '@mui/material'

const ProjectBPLinking = ({
  projIdentifiers,
  setProjIdentifiers,
  ...rest
}: any) => {
  const [isLinkedToBP, setIsLinkedToBP] = useState(false)

  const handleChangeBPLink = (event: ChangeEvent<HTMLInputElement>) => {
    // setIsLinkedToBP(event.target.checked)
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
      <div className="flex items-center gap-2.5">
        <NavigationButton direction={'next'} {...rest} />
        <NavigationButton direction={'back'} {...rest} />
      </div>
    </>
  )
}

export default ProjectBPLinking
