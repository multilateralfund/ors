import { PropsWithChildren } from 'react'

export interface DownloadButtonsProps {
  downloadTexts?: string[]
  downloadUrls?: string[]
}

export interface SCDownloadButtonProps {
  downloadText: string
  handleDownloadClick: () => void
}

export interface ReplenishmentHeadingProps extends PropsWithChildren {
  extraPeriodOptions?: { label: string; value: string }[]
  showPeriodSelector?: boolean
}
