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

  return (
    <div>
      <p className="mb-3 text-2xl font-normal">History</p>
      <div className="flex flex-col flex-wrap justify-center gap-1 rounded-lg bg-white px-4 py-3 shadow-lg">
        {versions.map((report: any, index: number) => {
          const { event_description, last_updated_at, last_updated_by } = report
          const dateObject = new Date(last_updated_at)

          const formattedDateTime = dateObject.toLocaleDateString(
            undefined,
            options,
          )

          return (
            <div key={index}>
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
                    {event_description}
                  </p>
                </div>
                <div>
                  <p
                    id={`report_user`}
                    className="my-1 w-fit rounded bg-gray-100 px-1 text-sm font-normal text-gray-500"
                  >
                    {last_updated_by}
                  </p>
                </div>
              </div>
              {index !== versions.length - 1 && (
                <hr className="h-px w-full border-0 bg-gray-200" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ReportHistory
