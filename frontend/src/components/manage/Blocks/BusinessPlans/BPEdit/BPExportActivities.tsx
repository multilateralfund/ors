import Link from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

const ExportBPActivities = ({
  agency,
  period,
}: {
  agency: any
  period: string
}) => {
  const commonSlice = useStore((state) => state.common)
  const agencies = commonSlice.agencies.data

  const currentAgency = agencies.find(
    (crtAgency: any) => crtAgency.name === agency,
  )

  const splitPeriod = period.split('-')

  return (
    <Link
      className="w-fit px-4 py-2 shadow-none"
      color="secondary"
      // @ts-ignore
      prefetch={false}
      size="large"
      target="_blank"
      variant="contained"
      href={formatApiUrl(
        `/api/business-plan-activity/export/?year_start=${splitPeriod[0]}&year_end=${splitPeriod[1]}&agency_id=${currentAgency?.id}`,
      )}
      button
      download
    >
      Download existing data
    </Link>
  )
}

export default ExportBPActivities
