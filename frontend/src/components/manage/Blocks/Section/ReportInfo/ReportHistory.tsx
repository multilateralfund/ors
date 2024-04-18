import cx from 'classnames'

import Loading from '@ors/components/theme/Loading/Loading'
import { useStore } from '@ors/store'

const ReportHistory = () => {
  const { report } = useStore((state) => state.cp_reports)
  const { data: versions, loading } = report.versions

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    hour: 'numeric',
    // hour12: false,
    minute: 'numeric',
    month: 'long',
    year: 'numeric',
  }

  if (loading)
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
    )

  if (!versions)
    return (
      <div>
        <p className="mb-3 text-2xl font-normal">History</p>
        <div className="flex flex-col flex-wrap justify-center gap-1 rounded-lg bg-white px-4 py-3 shadow-lg">
          <p className="text-md my-1 font-medium text-gray-900">
            No history available
          </p>
        </div>
      </div>
    )

  console.log('versions', versions)
  console.log('report', report)

  return (
    <div>
      <p className="mb-3 text-2xl font-normal">History</p>
      <div className="flex flex-col flex-wrap justify-center rounded-lg bg-white shadow-lg">
        {versions.map((version, versionIndex: number) => {
          return version.history.map((historyItem, historyIndex: number) => {
            const { created_at, event_description, updated_by_username } =
              historyItem

            const dateObject = new Date(created_at)
            const formattedDateTime = dateObject.toLocaleDateString(
              undefined,
              options,
            )
            const versionNo = version.version
            const displayHR =
              versionIndex !== versions.length - 1 ||
              historyIndex !== version.history.length - 1
            const isCurrentVersion = version.version === report.data?.version

            return (
              <>
                <div
                  key={`${versionIndex}-${historyIndex}`}
                  className={cx(
                    'px-4 py-3',
                    isCurrentVersion ? '' : 'opacity-40',
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
                        {event_description} ({`Version ${versionNo}`})
                      </p>
                    </div>
                    <div>
                      <p
                        id={`report_user`}
                        className="my-1 w-fit rounded bg-gray-100 px-1 text-sm font-normal text-gray-500"
                      >
                        {updated_by_username}
                      </p>
                    </div>
                  </div>
                </div>
                {displayHR && (
                  <hr className="h-px w-[95%] border-0 bg-gray-200 my-0" />
                )}
              </>
            )
          })
        })}
      </div>
    </div>
  )
}

export default ReportHistory
