import { CPHistoryItem } from '@ors/types/store'

import React from 'react'

import cx from 'classnames'

import { useStore } from '@ors/store'

const ReportHistory = () => {
  const { report } = useStore((state) => state.cp_reports)
  const history = report.data?.history

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    hour: 'numeric',
    // hour12: false,
    minute: 'numeric',
    month: 'long',
    year: 'numeric',
  }

  return (
    <div>
      <p className="mb-3 text-2xl font-normal">History</p>
      <div className="flex flex-col flex-wrap justify-center rounded-lg bg-white shadow-lg">
        {history?.map((historyItem: CPHistoryItem, index: number) => {
          const {
            created_at,
            event_description,
            report_version,
            reporting_officer_email,
            reporting_officer_name,
            updated_by_username,
          } = historyItem

          const reportingEmail = reporting_officer_email || updated_by_username

          const dateObject = new Date(created_at)
          const formattedDateTime = dateObject.toLocaleDateString(
            undefined,
            options,
          )
          const displayHR = index !== history.length - 1
          const isCurrentVersion = report_version === report.data?.version

          return (
            <React.Fragment key={`${index}`}>
              <div
                className={cx(
                  'px-4 py-3',
                  isCurrentVersion ? '' : 'opacity-50',
                )}
              >
                <div className="flex grow items-center justify-between gap-3 text-pretty">
                  <div className="flex items-center gap-2">
                    <p
                      id={`report_date`}
                      className="my-1 min-w-24 text-right text-sm font-normal text-gray-500"
                    >
                      {formattedDateTime}
                    </p>
                    <p
                      id={`report_summary`}
                      className="text-md my-1 font-medium text-gray-900"
                    >
                      {event_description} ({`Version ${report_version}`})
                    </p>
                  </div>
                  <div>
                    <p
                      id="reporting_officer"
                      className="my-1 w-fit rounded bg-gray-100 px-1 text-sm font-normal text-gray-500"
                    >
                      <span>{reporting_officer_name || ''}</span>
                      {reporting_officer_name && reportingEmail && (
                        <span> - </span>
                      )}
                      <span>
                        {reportingEmail}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              {displayHR && (
                <hr className="my-0 h-px w-[95%] border-0 bg-gray-200" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(ReportHistory)
