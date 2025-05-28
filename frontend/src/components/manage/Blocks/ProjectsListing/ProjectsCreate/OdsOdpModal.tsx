import { useState } from 'react'

import { widgets } from './SpecificFieldsHelpers'
import { OdsOdpFields, OdsOdpModalProps, SpecificFields } from '../interfaces'
import { getDefaultValues } from '../utils'

import { Button, Typography, Box, Modal } from '@mui/material'

const OdsOdpModal = ({
  displayModal,
  setDisplayModal,
  setProjectData,
  odsOdpFields,
  field,
}: OdsOdpModalProps) => {
  const sectionIdentifier = 'projectSpecificFields'

  type OdsOdpDataType = Partial<Record<keyof SpecificFields, OdsOdpFields>>

  const initialOdsOdp = getDefaultValues<OdsOdpFields>(odsOdpFields)
  const [odsOdpData, setOdsOdpData] = useState<OdsOdpDataType>({
    [field]: initialOdsOdp,
  })

  const saveOdsOdp = () => {
    setProjectData((prevData) => {
      const section = prevData[sectionIdentifier]
      const crtData = (section[field] as OdsOdpFields[]) || []

      const newOdsOdp = {
        ...odsOdpData[field],
        id: crtData.length + 1,
      }

      return {
        ...prevData,
        [sectionIdentifier]: {
          ...section,
          [field]: [...crtData, newOdsOdp],
        },
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
          {odsOdpFields.map((odsOdpField) =>
            widgets[odsOdpField.data_type]<OdsOdpDataType>(
              odsOdpData,
              setOdsOdpData,
              odsOdpField,
              {},
              false,
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
