import { useState } from 'react'

import { widgets } from './SpecificFieldsHelpers'
import { OdsOdpFields, OdsOdpModalProps } from '../interfaces'
import { getDefaultValues } from '../utils'

import { Button, Typography, Box, Modal } from '@mui/material'

const OdsOdpModal = ({
  displayModal,
  setDisplayModal,
  setFields,
  odsOdpFields,
  field,
}: OdsOdpModalProps) => {
  const initialOdsOdp = getDefaultValues<OdsOdpFields>(odsOdpFields)
  const [odsOdpData, setOdsOdpData] = useState<OdsOdpFields>(initialOdsOdp)

  const saveOdsOdp = () => {
    setFields((prevFields) => {
      const crtData = (prevFields[field] as OdsOdpFields[]) || []

      return {
        ...prevFields,
        [field]: [...crtData, { ...odsOdpData, id: crtData.length + 1 }],
      }
    })
    setDisplayModal(false)
  }

  return (
    <Modal
      aria-labelledby="odp-modal"
      open={displayModal}
      onClose={() => setDisplayModal(false)}
      keepMounted
    >
      <Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
        <div className="flex flex-col gap-y-2">
          {odsOdpFields.map((field) =>
            widgets[field.data_type]<OdsOdpFields>(
              odsOdpData,
              setOdsOdpData,
              field,
            ),
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <Typography>
            <Button onClick={saveOdsOdp}>Save</Button>
          </Typography>
          <Typography>
            <Button onClick={() => setDisplayModal(false)}>Close</Button>
          </Typography>
        </div>
      </Box>
    </Modal>
  )
}

export default OdsOdpModal
