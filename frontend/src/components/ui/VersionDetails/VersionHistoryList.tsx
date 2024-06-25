import { HistoryListItem } from '@ors/types/store'

import React, { useState } from 'react'

import cx from 'classnames'

export default function VersionHistoryList(props: any) {
  const { currentDataVersion, historyList, length, type } = props
  const [itemsToShow, setItemsToShow] = useState<number>(length || 3)
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    hour: 'numeric',
    // hour12: false,
    minute: 'numeric',
    month: 'long',
    year: 'numeric',
  }

  const showMoreItems = () => {
    setItemsToShow((prevItemsToShow) => prevItemsToShow + 3)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-2xl font-normal">History</p>
      <div className="flex flex-col flex-wrap justify-center rounded-lg bg-white shadow-lg">
        {historyList?.length === 0 && (
          <p
            id="business-plan-history"
            className="text-md my-1 font-medium text-gray-900 px-4 py-3"
          >
            There is no history for this version.
          </p>
        )}
        {historyList
          ?.slice(0, itemsToShow)
          .map((historyItem: HistoryListItem, index: number) => {
            const dateObject = new Date(historyItem.created_at)
            const formattedDateTime = dateObject.toLocaleDateString(
              undefined,
              options,
            )
            // @ts-ignore
            const data_version = historyItem[`${type}_version`]
            const displayHR = index !== itemsToShow - 1
            const isCurrentVersion = data_version === currentDataVersion

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
                        {historyItem.event_description} (
                        {`Version ${data_version}`})
                      </p>
                    </div>
                    <div>
                      <p
                        id="reporting_officer"
                        className="my-1 w-fit rounded bg-gray-100 px-1 text-sm font-normal text-gray-500"
                      >
                        <span>{historyItem.reporting_officer_name || ''}</span>
                        {historyItem.reporting_officer_name &&
                          historyItem.reporting_officer_email && (
                            <span> - </span>
                          )}
                        <span>{historyItem.reporting_officer_email || ''}</span>
                        <span> ({historyItem.updated_by_username})</span>
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
        {itemsToShow < historyList.length && (
          <div className="px-4 py-3">
            <span
              className="font-medium text-secondary hover:cursor-pointer"
              onClick={showMoreItems}
            >
              Show more
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
