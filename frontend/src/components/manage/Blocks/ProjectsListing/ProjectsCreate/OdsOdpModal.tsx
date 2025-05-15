import { useState } from 'react'

import { getDefaultValFields, widgets } from './SpecificFieldsHelpers'
import { OdsOdpFields, OdsOdpModalProps } from '../interfaces'

import { Button, Typography, Box, Modal } from '@mui/material'

const OdsOdpModal = ({
  displayODPModal,
  setDisplayODPModal,
  setProjectSpecificFields,
  odsOdpFields,
  field,
}: OdsOdpModalProps) => {
  const odsOdp = getDefaultValFields(odsOdpFields)
  const [odsOdpData, setOdsOdpData] = useState<OdsOdpFields>(
    odsOdp as OdsOdpFields,
  )

  const saveOdsOdp = () => {
    setProjectSpecificFields((prevFilters: any) => ({
      ...prevFilters,
      [field]: [
        ...prevFilters[field],
        { ...odsOdpData, id: prevFilters[field].length + 1 },
      ],
    }))
    setDisplayODPModal(false)
  }

  return (
    <Modal
      aria-labelledby="odp-modal"
      open={displayODPModal}
      onClose={() => setDisplayODPModal(false)}
      keepMounted
    >
      <Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
        <div className="flex flex-col gap-y-2">
          {odsOdpFields.map((field) =>
            widgets[field.data_type](
              field,
              odsOdpData as any,
              setOdsOdpData as any,
            ),
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <Typography>
            <Button onClick={saveOdsOdp}>Save</Button>
          </Typography>
          <Typography>
            <Button onClick={() => setDisplayODPModal(false)}>Close</Button>
          </Typography>
        </div>
      </Box>
    </Modal>
  )
}

export default OdsOdpModal
