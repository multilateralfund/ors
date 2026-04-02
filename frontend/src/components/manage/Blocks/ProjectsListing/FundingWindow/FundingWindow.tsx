import * as mui from '@mui/material'

import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import { GridOptions } from 'ag-grid-community'
import {
  FundingWindowPostType,
  FundingWindowType,
} from '@ors/types/api_funding_window.ts'
import { useGetFundingWindow } from '@ors/components/manage/Blocks/ProjectsListing/FundingWindow/hooks.ts'
import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils.ts'
import { FaPlusCircle } from 'react-icons/fa'
import React, { useMemo, useState } from 'react'
import {
  useDecisionOptions,
  useMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions.ts'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput.tsx'
import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import Field from '@ors/components/manage/Form/Field.tsx'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers.tsx'
import api from '../../../../../helpers/Api/_api.ts'

const dollarValueOrNull = (value: number | string) =>
  value ? `$${formatNumberValue(value)}` : null

const initialParams: FundingWindowPostType = {
  meeting_id: '',
  decision_id: '',
  description: '',
  amount: '',
  remarks: '',
}

export default function FundingWindow() {
  const [modalOpen, setModalOpen] = useState(false)
  const [requestParams, setRequestParams] =
    useState<FundingWindowPostType>(initialParams)
  const { loaded, loading, results, count, refetch, setParams } =
    useGetFundingWindow()

  const meetings = useMeetingOptions()
  const decisionsApi = useDecisionOptions(requestParams.meeting_id)
  const decisions = useMemo(() => decisionsApi.results, [decisionsApi.results])

  const columnDefs: GridOptions<FundingWindowType>['columnDefs'] = [
    {
      headerName: 'Meeting number',
      field: 'meeting.number',
      tooltipField: 'meeting.number',
    },
    {
      headerName: 'Decision number',
      field: 'decision.number',
      tooltipField: 'decision.number',
    },
    {
      headerName: 'Funding window description',
      field: 'description',
      tooltipField: 'description',
    },
    {
      headerName: 'Funding window amount (US$)',
      field: 'amount',
      tooltipField: 'amount',
      valueGetter: (params) => {
        return dollarValueOrNull(params?.data?.amount ?? 0)
      },
    },
    {
      headerName: 'Total project funding approved (US$)',
      field: 'total_project_funding_approved',
      tooltipField: 'total_project_funding_approved',
      valueGetter: (params) => {
        return (
          dollarValueOrNull(
            params?.data?.total_project_funding_approved ?? 0,
          ) ?? '0'
        )
      },
    },
    {
      headerName: 'Balance (US$)',
      field: 'balance',
      tooltipField: 'balance',
      valueGetter: (params) => {
        return dollarValueOrNull(params?.data?.balance ?? 0)
      },
    },
    {
      headerName: 'Remarks',
      field: 'remarks',
      tooltipField: 'remarks',
      sortable: false,
    },
  ]

  const handleModalClose = () => {
    setRequestParams(initialParams)
    setModalOpen(false)
    refetch()
  }

  const handleAddFundingWindow = async () => {
    await api('api/funding-window', {
      data: requestParams,
      method: 'POST',
    })
    handleModalClose()
  }

  return (
    <>
      <mui.Box>
        <div className="flex items-center justify-end py-3">
          <mui.Button
            variant="contained"
            color="primary"
            startIcon={<FaPlusCircle size={14} />}
            onClick={() => setModalOpen(true)}
          >
            Add funding window
          </mui.Button>
        </div>

        <mui.Modal
          aria-labelledby="add-funding-window"
          open={modalOpen}
          onClose={handleModalClose}
        >
          <mui.Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
            <mui.Typography
              id="add-funding-window"
              className="mb-4 text-typography-secondary"
              component="h2"
              variant="h6"
            >
              Add funding window
            </mui.Typography>
            <div className="flex w-full gap-3">
              <div className="w-full md:w-[7.76rem]">
                <Label htmlFor="meetingPopover">Meeting</Label>
                <PopoverInput
                  id="meetingPopover"
                  className="!m-0 mb-0 h-[2.25rem] min-h-[2.25rem] w-full truncate !py-1 !pr-0 text-[16px] md:w-[7.76rem]"
                  label={
                    meetings.filter(
                      (o) => o.value === requestParams.meeting_id,
                    )[0]?.label ?? ''
                  }
                  options={meetings}
                  withClear={true}
                  onChange={(value: string) => {
                    decisionsApi.setApiSettings((prev) => ({
                      ...prev,
                      options: { ...prev.options, triggerIf: true },
                    }))
                    decisionsApi.setParams({ meeting_id: value })
                    decisionsApi.refetch()
                    setRequestParams((prev) => ({
                      ...prev,
                      meeting_id: value ?? '',
                    }))
                  }}
                  onClear={() => {
                    setRequestParams((prev) => ({
                      ...prev,
                      meeting_id: '',
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
            </div>{' '}
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
                startIcon={<FaPlusCircle size={14} />}
                onClick={handleAddFundingWindow}
              >
                Add funding window
              </mui.Button>
              <mui.Button variant="text" onClick={handleModalClose}>
                Cancel
              </mui.Button>
            </div>
          </mui.Box>
        </mui.Modal>

        <ViewTable
          columnDefs={[...columnDefs]}
          defaultColDef={{
            headerClass: 'ag-text-center',
            cellClass: 'ag-text-center ag-cell-ellipsed',
            minWidth: 90,
            resizable: true,
            sortable: true,
          }}
          domLayout="normal"
          enablePagination={false}
          alwaysShowHorizontalScroll={false}
          loaded={loaded}
          loading={loading}
          resizeGridOnRowUpdate={true}
          rowCount={count}
          rowData={results}
          rowBuffer={120}
          rowsVisible={90}
          tooltipShowDelay={200}
          context={{ disableValidation: true }}
          components={{
            agColumnHeader: undefined,
            agTextCellRenderer: undefined,
          }}
          onSortChanged={({ api }) => {
            const ordering = api
              .getColumnState()
              .filter((column) => !!column.sort)
              .map(
                (column) =>
                  (column.sort === 'asc' ? '' : '-') +
                  column.colId.replaceAll('.', '__'),
              )
              .join(',')
            setParams({ offset: 0, ordering })
          }}
        />
      </mui.Box>
    </>
  )
}
