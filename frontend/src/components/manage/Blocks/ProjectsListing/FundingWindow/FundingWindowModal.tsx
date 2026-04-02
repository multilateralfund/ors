import * as mui from '@mui/material'

import {
  FundingWindowPostType,
  FundingWindowType,
} from '@ors/types/api_funding_window.ts'
import {
  useDecisionOptions,
  useMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions.ts'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput.tsx'
import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import Field from '@ors/components/manage/Form/Field.tsx'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers.tsx'
import { FaPlusCircle, FaEdit } from 'react-icons/fa'
import React, { useEffect, useMemo, useState } from 'react'

const initialParams: FundingWindowPostType = {
  meeting_id: null,
  decision_id: null,
  description: '',
  amount: '',
  remarks: '',
}

interface FundingWindowModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: FundingWindowPostType, id?: number) => void
  editData?: FundingWindowType | null
}

export default function FundingWindowModal({
  open,
  onClose,
  onSubmit,
  editData,
}: FundingWindowModalProps) {
  const isEditing = !!editData
  const [requestParams, setRequestParams] =
    useState<FundingWindowPostType>(initialParams)

  const meetings = useMeetingOptions()
  const decisionsApi = useDecisionOptions(requestParams.meeting_id)
  const decisions = useMemo(() => decisionsApi.results, [decisionsApi.results])

  // Populate form and trigger decisions fetch when editing
  useEffect(() => {
    if (editData) {
      setRequestParams({
        meeting_id: editData.meeting?.id,
        decision_id: editData.decision?.id,
        description: editData.description ?? '',
        amount: editData.amount?.toString() ?? '',
        remarks: editData.remarks ?? '',
      })
      // Trigger decisions fetch for the selected meeting
      if (editData.meeting?.id) {
        decisionsApi.setApiSettings((prev) => ({
          ...prev,
          options: { ...prev.options, triggerIf: true },
        }))
        decisionsApi.setParams({ meeting_id: editData.meeting.id })
        decisionsApi.refetch()
      }
    } else {
      setRequestParams(initialParams)
    }
  }, [editData, open])

  const handleClose = () => {
    setRequestParams(initialParams)
    onClose()
  }

  const handleSubmit = () => {
    onSubmit(requestParams, editData?.id)
    setRequestParams(initialParams)
  }

  console.log(
    meetings,
    meetings.filter((o) => o.value === requestParams.meeting_id),
    requestParams.meeting_id,
  )

  return (
    <mui.Modal
      aria-labelledby={isEditing ? 'edit-funding-window' : 'add-funding-window'}
      open={open}
      onClose={handleClose}
    >
      <mui.Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
        <mui.Typography
          id={isEditing ? 'edit-funding-window' : 'add-funding-window'}
          className="mb-4 text-typography-secondary"
          component="h2"
          variant="h6"
        >
          {isEditing ? 'Edit funding window' : 'Add funding window'}
        </mui.Typography>
        <div className="flex w-full gap-3">
          <div className="w-full md:w-[7.76rem]">
            <Label htmlFor="meetingPopover">Meeting</Label>
            <PopoverInput
              id="meetingPopover"
              className="!m-0 mb-0 h-[2.25rem] min-h-[2.25rem] w-full truncate !py-1 !pr-0 text-[16px] md:w-[7.76rem]"
              label={
                meetings.filter((o) => o.value === requestParams.meeting_id)[0]
                  ?.label ?? ''
              }
              options={meetings}
              withClear={true}
              onChange={(value: string) => {
                const meeting_id = parseInt(value, 10)
                console.log(value, meeting_id)
                decisionsApi.setApiSettings((prev) => ({
                  ...prev,
                  options: { ...prev.options, triggerIf: true },
                }))
                decisionsApi.setParams({ meeting_id: meeting_id })
                decisionsApi.refetch()
                setRequestParams((prev) => ({
                  ...prev,
                  meeting_id: meeting_id ?? null,
                  decision_id: null,
                }))
              }}
              onClear={() => {
                setRequestParams((prev) => ({
                  ...prev,
                  meeting_id: null,
                  decision_id: null,
                }))
              }}
            />
          </div>
          <div className="w-full md:w-[7.76rem]">
            <Label htmlFor="decisionField">Decision</Label>
            <Field<any>
              id="decisionField"
              widget="autocomplete"
              options={decisions}
              value={requestParams.decision_id ?? null}
              onChange={(_, value: (typeof decisions)[0]) => {
                setRequestParams((prev) => ({
                  ...prev,
                  decision_id: value?.value ?? '',
                }))
              }}
              getOptionLabel={(option) =>
                getOptionLabel(decisions, option, 'value')
              }
            />
          </div>
        </div>
        <div className="w-full">
          <Label htmlFor="amountInput">Amount</Label>
          <FormattedNumberInput
            id="amountInput"
            className="!ml-0 w-80"
            value={requestParams.amount}
            onChange={(evt) =>
              setRequestParams((prev) => ({
                ...prev,
                amount: evt.target.value ?? '',
              }))
            }
          />
        </div>
        <div className="w-full">
          <Label htmlFor="descriptionField">Description</Label>
          <mui.TextareaAutosize
            id="descriptionField"
            className="w-full"
            value={requestParams.description}
            onChange={(event) =>
              setRequestParams((prev) => ({
                ...prev,
                description: event.target?.value ?? '',
              }))
            }
            maxLength={1000}
            minRows={6}
          />
        </div>
        <div className="w-full">
          <Label htmlFor="remarksField">Remarks</Label>
          <mui.TextareaAutosize
            id="remarksField"
            className="w-full"
            value={requestParams.remarks}
            onChange={(event) =>
              setRequestParams((prev) => ({
                ...prev,
                remarks: event.target?.value ?? '',
              }))
            }
            maxLength={1000}
            minRows={6}
          />
        </div>
        <div className="mt-4 flex w-full items-center justify-between">
          <mui.Button
            variant="contained"
            startIcon={
              isEditing ? <FaEdit size={14} /> : <FaPlusCircle size={14} />
            }
            onClick={handleSubmit}
          >
            {isEditing ? 'Save changes' : 'Add funding window'}
          </mui.Button>
          <mui.Button variant="text" onClick={handleClose}>
            Cancel
          </mui.Button>
        </div>
      </mui.Box>
    </mui.Modal>
  )
}
