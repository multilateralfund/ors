import { ApiCreatedBlend } from '@ors/types/api_blends'

import React from 'react'

import {
  Box,
  Button,
  Divider,
  Modal,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

import { CreateBlend } from '@ors/components/manage/Blocks/Section/SectionB/Create/CreateBlend'
import Field from '@ors/components/manage/Form/Field'

export function NewChemicalModal(props: {
  groupBy: (option: any) => any
  mandatoryChemicals: Array<any>
  onChangeChemical: (event: any, newChemical: any) => void
  onChangeTab: (_: any, value: any) => void
  onCloseBlendModal: () => void
  onCloseModal: () => void
  onCreateBlend: (blend: ApiCreatedBlend) => void
  open: boolean
  optionLabel: (option: any) => any
  optionalBlends: Array<any>
  substances: Array<any>
  value: 'existing_blends' | 'new_blend'
}) {
  return (
    <Modal
      aria-labelledby="add-blend-modal-title"
      open={props.open}
      onClose={props.onCloseModal}
    >
      <Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-2xl">
        <Typography
          id="add-blend-modal-title"
          className="mb-2"
          component="h2"
          variant="h6"
        >
          Add blend
        </Typography>
        <Divider />
        <ToggleButtonGroup
          className="mb-4 mt-4"
          color="primary"
          value={props.value}
          onChange={props.onChangeTab}
          exclusive
        >
          <ToggleButton
            className="rounded-none border-primary py-2 text-base tracking-wide first:rounded-l-lg last:rounded-r-lg"
            value="existing_blends"
            classes={{
              selected: 'bg-primary text-mlfs-hlYellow',
              standard: 'bg-white text-primary',
            }}
          >
            Existing blend(s)
          </ToggleButton>
          <ToggleButton
            className="rounded-none border-primary py-2 text-base tracking-wide first:rounded-l-lg last:rounded-r-lg"
            value="new_blend"
            classes={{
              selected: 'bg-primary text-mlfs-hlYellow',
              standard: 'bg-white text-primary',
            }}
          >
            New blend
          </ToggleButton>
        </ToggleButtonGroup>
        {props.value === 'existing_blends' && (
          <>
            <Typography>Mandatory / usual blends</Typography>
            <Field
              getOptionLabel={props.optionLabel}
              groupBy={props.groupBy}
              options={props.mandatoryChemicals}
              value={null}
              widget="autocomplete"
              Input={{
                autoComplete: 'off',
              }}
              onChange={props.onChangeChemical}
            />
            <Typography>
              Other blends (Mixture of controlled substances)
            </Typography>
            <Field
              getOptionLabel={props.optionLabel}
              groupBy={props.groupBy}
              options={props.optionalBlends}
              value={null}
              widget="autocomplete"
              Input={{
                autoComplete: 'off',
              }}
              onChange={props.onChangeChemical}
            />
            <Typography className="text-right">
              <Button onClick={props.onCloseModal}>Close</Button>
            </Typography>
          </>
        )}
        {props.value === 'new_blend' && (
          <CreateBlend
            noModal={true}
            substances={props.substances}
            onClose={props.onCloseBlendModal}
            onCreateBlend={props.onCreateBlend}
          />
        )}
      </Box>
    </Modal>
  )
}
