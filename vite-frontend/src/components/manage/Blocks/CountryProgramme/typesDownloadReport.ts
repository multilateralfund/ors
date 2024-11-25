import { Report } from '@ors/types/store'

export interface IDownloadReportProps {
  archive: boolean
  convertData: 0 | 1
  report: Report
}
