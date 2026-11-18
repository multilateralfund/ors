import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@ors/helpers'
import PCRBulkExtractionModal from './PCRBulkExtractionModal'

const setLocation = vi.fn()

vi.mock('@ors/helpers', () => ({ api: vi.fn() }))
vi.mock('wouter', () => ({ useLocation: () => ['/pcr', setLocation] }))
vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))
vi.mock('@ors/components/ui/Link/Link', () => ({
  default: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode
    onClick: () => void
    disabled: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))
vi.mock(
  '@ors/components/manage/Blocks/ProjectsListing/HelperComponents',
  () => ({
    CancelButton: ({ onClick }: { onClick: () => void }) => (
      <button onClick={onClick}>Cancel</button>
    ),
  }),
)

const listingParams = {
  limit: 50,
  offset: 100,
  pcr_submitted: 'Yes',
  country_id: '12',
  pcr_submission_year: '2025',
}

const renderModal = () =>
  render(
    <PCRBulkExtractionModal
      open
      onClose={vi.fn()}
      params={listingParams}
      pcrCount={3}
    />,
  )

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PCRBulkExtractionModal', () => {
  it('exports all the sections as PDF by default', async () => {
    vi.mocked(api).mockResolvedValueOnce({ id: 7 })
    renderModal()

    expect(screen.getByText(/3 PCRs matching the filters/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'PDF' })).toBeChecked()

    await userEvent.click(screen.getByRole('button', { name: 'Extract' }))

    expect(api).toHaveBeenCalledWith('api/pcr-metaprojects/export_pcrs/', {
      method: 'POST',
      // the listing filters, without the pagination
      params: {
        pcr_submitted: 'Yes',
        country_id: '12',
        pcr_submission_year: '2025',
      },
      data: {
        output_format: 'pdf',
        sections: [
          'overview',
          'summary_of_key_data',
          'project_results',
          'causes_of_delay',
          'lessons_learned',
          'gender_mainstreaming',
          'sdgs',
          'supporting_evidence',
        ],
      },
    })
    await waitFor(() =>
      expect(setLocation).toHaveBeenCalledWith('/pcr/exports/7'),
    )
  })

  it('exports the selected sections in the selected format', async () => {
    vi.mocked(api).mockResolvedValueOnce({ id: 8 })
    renderModal()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }))
    expect(screen.getByRole('button', { name: 'Extract' })).toBeDisabled()

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'SDGs contribution' }),
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Overview' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Excel' }))
    expect(screen.getByText(/One Excel file/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Extract' }))

    expect(api).toHaveBeenCalledWith(
      'api/pcr-metaprojects/export_pcrs/',
      expect.objectContaining({
        data: { output_format: 'xlsx', sections: ['sdgs', 'overview'] },
      }),
    )
  })
})
