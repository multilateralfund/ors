import { CPReport } from '@ors/types/store'

export interface IDownloadReportProps {
  archive: boolean
  convertData: 0 | 1
  report: CPReport
}
