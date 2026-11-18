import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import PCRExportStatus from './PCRExportStatus'
import { api } from '@ors/helpers'

vi.mock('@ors/helpers', () => ({
  api: vi.fn(),
  formatApiUrl: (path: string) => `http://backend${path}`,
}))
vi.mock('@ors/components/ui/Link/Link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const pcrExport = {
  id: 5,
  output_format: 'pdf',
  pcr_count: 12,
  filename: 'PCR export 2026-11-18.zip',
  error: '',
  download_url: null,
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => vi.useRealTimers())

describe('PCRExportStatus', () => {
  it('polls the export until it is completed', async () => {
    vi.mocked(api)
      .mockResolvedValueOnce({ ...pcrExport, status: 'in_progress' })
      .mockResolvedValueOnce({
        ...pcrExport,
        status: 'completed',
        download_url: '/api/pcr-exports/5/download/',
      })

    render(<PCRExportStatus exportId="5" />)

    expect(
      await screen.findByText('Your PCR export is being prepared...'),
    ).toBeInTheDocument()
    expect(screen.getByText(/^12 PCRs\./)).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(3000)

    const download = await screen.findByRole('link', { name: 'Download' })
    // a direct download, the file can be large
    expect(download).toHaveAttribute(
      'href',
      'http://backend/api/pcr-exports/5/download/',
    )
    expect(api).toHaveBeenCalledTimes(2)
    expect(api).toHaveBeenCalledWith('api/pcr-exports/5/')
  })

  it('shows the error of a failed export', async () => {
    vi.mocked(api).mockResolvedValueOnce({
      ...pcrExport,
      status: 'failed',
      error: 'The export could not be generated.',
    })

    render(<PCRExportStatus exportId="5" />)

    expect(
      await screen.findByText('The export could not be generated.'),
    ).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(3000)
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('shows an error when the export does not exist', async () => {
    vi.mocked(api).mockRejectedValueOnce(new Response(null, { status: 404 }))

    render(<PCRExportStatus exportId="5" />)

    expect(
      await screen.findByText(
        'The export could not be found. Please start a new export.',
      ),
    ).toBeInTheDocument()
  })
})
