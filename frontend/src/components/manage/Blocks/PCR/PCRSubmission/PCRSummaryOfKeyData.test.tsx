import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRSummaryOfKeyData from './PCRSummaryOfKeyData'

vi.mock('@ors/hooks/useApi', () => ({
  default: () => ({
    data: [
      { id: 10, name: 'Substance from' },
      { id: 20, name: 'Substance to' },
    ],
    loaded: true,
    loading: false,
  }),
}))

vi.mock('@ors/components/manage/Form/ViewTable', () => ({
  default: ({ columnDefs }: any) =>
    columnDefs[0].cellRenderer({
      data: { id: 101, code: 'PCR-TEST-101' },
      value: 'PCR-TEST-101',
    }),
}))

const createInitialPCRData = () => ({
  overview: {},
  summary_of_key_data: [
    {
      project_id: 101,
      funds_disbursed: '9876.54',
      planned_date_of_completion: '2026-08-31',
      alternative_technologies: [
        {
          substance_from: 10,
          substance_to: 20,
        },
      ],
      enterprises: [
        {
          name: 'Updated enterprise',
          address: 'Updated address',
        },
      ],
      equipments: [
        {
          name: 'Updated equipment',
          description: 'Disposed',
          disposal_type: 2,
          disposal_date: '2026-09-30',
        },
      ],
    },
  ],
  results_assessment: [],
  causes_of_delay: [],
  lessons_learned: [],
  gender_mainstreaming: [],
  sdgs_contribution: [],
})

const renderSummary = (initialPCRData = createInitialPCRData()) => {
  const setPCRData = vi.fn()
  const setErrors = vi.fn()

  render(
    <PCRDataContext.Provider
      value={
        {
          PCRData: initialPCRData,
          setPCRData,
          errors: {},
          setErrors,
          pcrMetaproject: {
            data: {
              projects: [{ id: 101, code: 'PCR-TEST-101' }],
            },
            loaded: true,
            loading: false,
          },
        } as any
      }
    >
      <PCRSummaryOfKeyData />
    </PCRDataContext.Provider>,
  )

  return { initialPCRData, setPCRData }
}

const openSummaryDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    screen.getByRole('button', { name: 'Edit project PCR-TEST-101' }),
  )
}

describe('PCRSummaryOfKeyData', () => {
  it('keeps every backend-compatible summary section when Done is clicked', async () => {
    const user = userEvent.setup()
    const { initialPCRData, setPCRData } = renderSummary()

    await openSummaryDialog(user)
    expect(screen.getByText('Funds disbursed')).toBeInTheDocument()

    await user.click(
      screen.getByRole('tab', { name: 'Alternative technology' }),
    )
    expect(screen.getByText('Substance converted from')).toBeInTheDocument()
    expect(screen.getByText('Substance converted to')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Enterprises' }))
    expect(screen.getByDisplayValue('Updated enterprise')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Updated address')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Equipment' }))
    expect(screen.getByDisplayValue('Updated equipment')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Disposed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(setPCRData).toHaveBeenCalledOnce()
    expect(setPCRData).toHaveBeenCalledWith(
      expect.any(Function),
      'summary_of_key_data',
    )

    const updater = setPCRData.mock.calls[0][0]
    expect(updater(initialPCRData)).toMatchObject({
      summary_of_key_data: [
        {
          project_id: 101,
          funds_disbursed: '9876.54',
          planned_date_of_completion: '2026-08-31',
          alternative_technologies: [
            {
              substance_from: 10,
              substance_to: 20,
            },
          ],
          enterprises: [
            {
              name: 'Updated enterprise',
              address: 'Updated address',
            },
          ],
          equipments: [
            {
              name: 'Updated equipment',
              description: 'Disposed',
              disposal_type: 2,
              disposal_date: '2026-09-30',
            },
          ],
        },
      ],
    })
  })

  it('discards draft row changes when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const { setPCRData } = renderSummary()

    await openSummaryDialog(user)
    await user.click(screen.getByRole('tab', { name: 'Equipment' }))
    await user.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(
      screen.getAllByRole('button', { name: 'Remove equipment' }),
    ).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(setPCRData).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it.each([
    {
      tab: 'Alternative technology',
      addButton: 'Add alternative technology',
      removeButton: 'Remove alternative technology',
    },
    {
      tab: 'Enterprises',
      addButton: 'Add enterprise',
      removeButton: 'Remove enterprise',
    },
    {
      tab: 'Equipment',
      addButton: 'Add equipment',
      removeButton: 'Remove equipment',
    },
  ])('adds and removes $tab rows', async ({ tab, addButton, removeButton }) => {
    const user = userEvent.setup()
    const { setPCRData } = renderSummary()

    await openSummaryDialog(user)
    await user.click(screen.getByRole('tab', { name: tab }))
    await user.click(screen.getByRole('button', { name: addButton }))

    expect(screen.getAllByRole('button', { name: removeButton })).toHaveLength(
      2,
    )

    await user.click(screen.getAllByRole('button', { name: removeButton })[1])
    expect(screen.getAllByRole('button', { name: removeButton })).toHaveLength(
      1,
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(setPCRData).toHaveBeenCalledOnce()
  })
})
