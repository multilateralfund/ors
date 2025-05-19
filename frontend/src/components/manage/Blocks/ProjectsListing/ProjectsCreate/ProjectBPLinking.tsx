import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import LinkedBPTableWrapper, {
  LinkedBPTableWrapperProps,
} from './LinkedBPTable'

import { Checkbox, FormControlLabel } from '@mui/material'

type ProjectBPLinkingProps = LinkedBPTableWrapperProps & {
  isLinkedToBP: boolean
  setIsLinkedToBP: Dispatch<SetStateAction<boolean>>
  setBpId: Dispatch<SetStateAction<number | null>>
}

const ProjectBPLinking = ({
  isLinkedToBP,
  setIsLinkedToBP,
  setBpId,
  ...rest
}: ProjectBPLinkingProps) => {
  const handleChangeBPLink = (event: ChangeEvent<HTMLInputElement>) => {
    setIsLinkedToBP(event.target.checked)

    if (!event.target.checked) {
      setBpId(null)
    }
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
      {isLinkedToBP && <LinkedBPTableWrapper setBpId={setBpId} {...rest} />}
    </>
  )
}

export default ProjectBPLinking
