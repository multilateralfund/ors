import { useState } from 'react'

import { widgets } from './SpecificFieldsHelpers'
import { OdsOdpFields, OdsOdpModalProps, SpecificFields } from '../interfaces'
import { getDefaultValues } from '../utils'

import { Button, Typography, Box, Modal, Alert } from '@mui/material'

const OdsOdpModal = ({
  displayModal,
  setDisplayModal,
  setProjectData,
  odsOdpFields = [],
  field,
}: OdsOdpModalProps) => {
  const sectionIdentifier = 'projectSpecificFields'

  type OdsOdpDataType = Partial<Record<keyof SpecificFields, OdsOdpFields>>

  const initialOdsOdp = getDefaultValues<OdsOdpFields>(odsOdpFields)
  const [odsOdpData, setOdsOdpData] = useState<OdsOdpDataType>({
    [field]: initialOdsOdp,
  })
  const [isModalValid, setIsModalValid] = useState<boolean>(true)

  const substanceFieldName = 'ods_substance_id'
  const hasSubstanceId = odsOdpData[field]?.[substanceFieldName]
  const substanceField = odsOdpFields.find(
    ({ write_field_name }) => write_field_name === substanceFieldName,
  )
  const substanceLabel =
    substanceField?.label ?? 'Substance - baseline technology'
  const substanceError = {
    [substanceLabel as string]: !hasSubstanceId
      ? [`${substanceLabel} is required.`]
      : [],
  }

  const saveOdsOdp = () => {
    if (hasSubstanceId) {
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
    } else {
      setIsModalValid(false)
    }
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
              substanceError,
              !isModalValid,
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
        {!isModalValid && (
          <Alert className="BPAlert mt-2 w-fit border-0" severity="error">
            <div className="mt-0.5 text-lg">{substanceLabel} is required.</div>
          </Alert>
        )}
      </Box>
    </Modal>
  )
}

export default OdsOdpModal
