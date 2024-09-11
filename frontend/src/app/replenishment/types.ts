import { PropsWithChildren } from 'react'

export interface DownloadButtonsProps {
  downloadTexts?: string[]
  downloadUrls?: string[]
}

export interface ReplenishmentHeadingProps extends PropsWithChildren {
  extraPeriodOptions?: { label: string; value: string }[]
  showPeriodSelector?: boolean
}
