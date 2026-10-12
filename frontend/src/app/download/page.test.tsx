import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticatedFetch } from '@ors/helpers/Api/authenticatedFetch'
import useSearchParams from '@ors/hooks/useSearchParams'
import DownloadPage from './page'

vi.mock('@ors/helpers/Api/authenticatedFetch', () => ({
  authenticatedFetch: vi.fn(),
}))
vi.mock('@ors/helpers', () => ({ formatApiUrl: (path: string) => path }))
vi.mock('@ors/hooks/useSearchParams', () => ({ default: vi.fn() }))
vi.mock('@ors/hooks/usePageTitle', () => ({ default: vi.fn() }))
vi.mock('@ors/components/theme/PageWrapper/PageWrapper', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('@ors/components/ui/Button/Button', () => ({
  SubmitButton: (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} />
  ),
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams({
      target: '/api/projects/v2/export/?project_id=44063',
    }),
  )
  vi.mocked(authenticatedFetch).mockResolvedValue(new Response('export'))
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn().mockReturnValue('blob:export'),
      revokeObjectURL: vi.fn(),
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('existing long-download page', () => {
  it('uses the raw authenticated fetch for the configured API', async () => {
    render(<DownloadPage />)
    await screen.findByRole('button', { name: 'Save file' })
    expect(authenticatedFetch).toHaveBeenCalledWith(
      new URL(
        '/api/projects/v2/export/?project_id=44063',
        window.location.origin,
      ).href,
      { signal: expect.any(AbortSignal) },
    )
  })

  it('rejects external targets before acquiring or sending a token', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams({ target: 'https://untrusted.example/api/export/' }),
    )
    render(<DownloadPage />)
    await waitFor(() =>
      expect(
        screen.getByText('The download target is not permitted.'),
      ).toBeInTheDocument(),
    )
    expect(authenticatedFetch).not.toHaveBeenCalled()
  })
})
