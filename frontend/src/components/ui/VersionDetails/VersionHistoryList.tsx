import { HistoryListItem } from '@ors/types/store'

import React, { useState } from 'react'

import cx from 'classnames'

import { FaClockRotateLeft } from 'react-icons/fa6'
import { HeaderWithIcon } from '@ors/components/manage/Blocks/BusinessPlans/HelperComponents'

export default function VersionHistoryList(props: any) {
  const { currentDataVersion, historyList, length, type } = props
  const initialItemsToShow = length || 3
  const [itemsToShow, setItemsToShow] = useState<number>(initialItemsToShow)
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    hour: 'numeric',
    // hour12: false,
    minute: 'numeric',
    month: 'long',
    year: 'numeric',
  }

  const showMoreItems = () => {
    setItemsToShow((prevItemsToShow) =>
      Math.min(prevItemsToShow + 3, historyList.length),
    )
  }

  const showLessItems = () => {
    setItemsToShow((prevItemsToShow) =>
      Math.max(prevItemsToShow - 3, initialItemsToShow),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <HeaderWithIcon title="History" Icon={FaClockRotateLeft} />
      <div className="flex flex-col flex-wrap justify-center rounded-lg bg-white transition-all">
        {historyList?.length === 0 && (
          <p
            id="business-plan-history"
            className="text-md my-1 px-4 py-3 pl-0 font-medium text-gray-900"
          >
            There is no history for this{' '}
            {type === 'bp' ? 'business plan' : 'version'}.
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

            const {
              event_description,
              updated_by_email,
              updated_by_first_name,
              updated_by_last_name,
              updated_by_username,
            } = historyItem

            return (
              <React.Fragment key={`${index}`}>
                <div
                  className={cx(
                    'px-4 py-3 pl-0',
                    isCurrentVersion ||
                      (type === 'bp' && [0, 1].includes(index))
                      ? ''
                      : 'opacity-50',
                  )}
                >
                  <div className="flex grow items-center justify-between gap-3 text-pretty">
                    <div className="flex items-center gap-2">
                      <p
                        id={`report_date`}
                        className="my-1 min-w-24 text-sm font-normal text-gray-500"
                      >
                        {formattedDateTime}
                      </p>
                      <p
                        id={`report_summary`}
                        className="text-md my-1 font-medium text-gray-900"
                      >
                        {event_description}{' '}
                        {type !== 'bp' && `(Version ${data_version})`}
                      </p>
                    </div>
                    <div>
                      <p
                        id="reporting_officer"
                        className="my-1 w-fit rounded bg-gray-100 px-1 text-sm font-normal text-gray-500"
                      >
                        <span>
                          {updated_by_first_name || ''}{' '}
                          {updated_by_last_name || ''}
                        </span>
                        {(updated_by_last_name || updated_by_first_name) &&
                          updated_by_email && <span> - </span>}
                        <span>{updated_by_email || ''}</span>
                        <span> ({updated_by_username})</span>
                      </p>
                    </div>
                  </div>
                </div>
                {displayHR && (
                  <hr className="mx-0 my-0 h-px !w-[98%] border-0 bg-gray-200" />
                )}
              </React.Fragment>
            )
          })}
        <div className="flex items-center justify-start">
          {itemsToShow < historyList.length && (
            <div className="px-4 py-3 pl-0">
              <span
                className="font-medium text-secondary hover:cursor-pointer"
                onClick={showMoreItems}
              >
                Show more
              </span>
            </div>
          )}
          {itemsToShow > initialItemsToShow && (
            <div className="px-4 py-3">
              <span
                className="font-medium text-secondary hover:cursor-pointer"
                onClick={showLessItems}
              >
                Show less
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
