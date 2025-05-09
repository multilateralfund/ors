import { ChangeEvent, useState } from 'react'

import Field from '@ors/components/manage/Form/Field'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  getOptionLabel,
  isOptionEqualToValue,
} from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { ApiSubstance } from '@ors/types/api_substances'
import { handleChangeNumericField } from '../utils'
import { OdsOdpFields, OdsOdpModalProps, OdsTypesType } from '../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  odsTypeOpts,
  tableColumns,
  textAreaClassname,
} from '../constants'
import { useStore } from '@ors/store'

import { Button, Typography, Box, Modal, TextareaAutosize } from '@mui/material'

const OdsOdp = {
  ods_substance_id: null,
  odp: '',
  ods_replacement: '',
  co2_mt: '',
  phase_out_mt: '',
  ods_type: null,
  ods_blend_id: null,
  sort_order: null,
}

const OdsOdpModal = ({
  displayODPModal,
  setDisplayODPModal,
  setProjectSpecificFields,
}: OdsOdpModalProps) => {
  const [odsOdpData, setOdsOdpData] = useState<OdsOdpFields>(OdsOdp)

  const cpReportsSlice = useStore((state) => state.cp_reports)
  const substances = cpReportsSlice.substances.data

  const handleChangeSubstance = (substance: ApiSubstance | null) => {
    setOdsOdpData((prevFilters: any) => ({
      ...prevFilters,
      ods_substance_id: substance?.id ?? null,
    }))
  }

  const handleChangeOdsReplacement = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setOdsOdpData((prevFilters) => ({
      ...prevFilters,
      ods_replacement: event.target.value,
    }))
  }

  const handleChangeOdsType = (odsType: OdsTypesType | null) => {
    setOdsOdpData((prevFilters: any) => ({
      ...prevFilters,
      ods_type: odsType?.id ?? null,
    }))
  }

  const saveOdsOdp = () => {
    setProjectSpecificFields((prevFilters: any) => ({
      ...prevFilters,
      ods_odp: [
        ...prevFilters.ods_odp,
        { ...odsOdpData, id: prevFilters.ods_odp.length + 1 },
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
          <div>
            <Label>{tableColumns.ods_substance_id}</Label>
            <Field<ApiSubstance>
              widget="autocomplete"
              options={substances}
              value={odsOdpData?.ods_substance_id as ApiSubstance | null}
              onChange={(_: React.SyntheticEvent, value) =>
                handleChangeSubstance(value as ApiSubstance | null)
              }
              getOptionLabel={(option: any) =>
                getOptionLabel(substances, option)
              }
              isOptionEqualToValue={isOptionEqualToValue}
              {...defaultProps}
            />
          </div>
          <div>
            <div>
              <Label>{tableColumns.ods_replacement}</Label>
              <TextareaAutosize
                value={odsOdpData?.ods_replacement}
                onChange={handleChangeOdsReplacement}
                className={textAreaClassname + ' !min-h-[15px] w-full'}
                minRows={2}
                tabIndex={-1}
              />
            </div>
          </div>
          <div>
            <Label>{tableColumns.co2_mt}</Label>
            <SimpleInput
              id={odsOdpData?.co2_mt}
              value={odsOdpData?.co2_mt}
              onChange={(event) =>
                handleChangeNumericField(event, 'co2_mt', setOdsOdpData)
              }
              type="number"
              {...defaultPropsSimpleField}
            />
          </div>
          <div>
            <Label>{tableColumns.odp}</Label>
            <SimpleInput
              id={odsOdpData?.odp}
              value={odsOdpData?.odp}
              onChange={(event) =>
                handleChangeNumericField(event, 'odp', setOdsOdpData)
              }
              type="number"
              {...defaultPropsSimpleField}
            />
          </div>
          <div>
            <Label>{tableColumns.phase_out_mt}</Label>
            <SimpleInput
              id={odsOdpData?.phase_out_mt}
              value={odsOdpData?.phase_out_mt}
              onChange={(event) =>
                handleChangeNumericField(event, 'phase_out_mt', setOdsOdpData)
              }
              type="number"
              {...defaultPropsSimpleField}
            />
          </div>
          <div>
            <Label>{tableColumns.ods_type}</Label>
            <Field<OdsTypesType>
              widget="autocomplete"
              options={odsTypeOpts}
              value={odsOdpData?.ods_type as OdsTypesType | null}
              onChange={(_: React.SyntheticEvent, value) =>
                handleChangeOdsType(value as OdsTypesType | null)
              }
              getOptionLabel={(option: any) =>
                getOptionLabel(odsTypeOpts, option)
              }
              isOptionEqualToValue={isOptionEqualToValue}
              {...defaultProps}
            />
          </div>
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
