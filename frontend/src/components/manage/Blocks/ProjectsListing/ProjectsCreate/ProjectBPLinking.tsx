import { ChangeEvent } from 'react'

import LinkedBPTableWrapper, {
  LinkedBPTableWrapperProps,
} from './LinkedBPTable'

import { Checkbox, FormControlLabel } from '@mui/material'

type ProjectBPLinkingProps = LinkedBPTableWrapperProps & {
  isLinkedToBP: boolean
  setIsLinkedToBP: React.Dispatch<React.SetStateAction<boolean>>
}

const ProjectBPLinking = ({
  isLinkedToBP,
  setIsLinkedToBP,
  ...rest
}: ProjectBPLinkingProps) => {
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
