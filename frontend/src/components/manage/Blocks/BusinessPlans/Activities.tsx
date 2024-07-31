import Loading from '@ors/components/theme/Loading/Loading'

export default function Activities(props: any) {
  const { loaded, period, results } = props

  if (!loaded) {
    return <Loading />
  }

  return (
    <ul className="flex list-none flex-col gap-4 pl-0">
      {results.map((activity: any) => {
        return (
          <li
            key={activity.id}
            className="flex items-center justify-between rounded-lg p-4"
            style={{ boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.2)' }}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                <span>Country</span>
                <h4 className="m-0">{activity.country.iso3}</h4>
              </span>
              {!period && (
                <span className="flex items-center gap-2">
                  <span>Agency</span>
                  <h4 className="m-0">{activity.agency}</h4>
                </span>
              )}
              <span className="flex items-center gap-2">
                <span>Cluster</span>
                <h4 className="m-0">{activity.project_cluster || '-'}</h4>
              </span>
              <span className="flex items-center gap-2">
                <span>Type</span>
                <h4 className="m-0">{activity.project_type || '-'}</h4>
              </span>
              <span className="flex items-center gap-2">
                <span>Chemical Type</span>
                <h4 className="m-0">{activity.bp_chemical_type || '-'}</h4>
              </span>
              <span className="flex items-center gap-2">
                <span>Sector</span>
                <h4 className="m-0">{activity.sector || '-'}</h4>
              </span>
              <span className="flex items-center gap-2">
                <span>Subsector</span>
                <h4 className="m-0">{activity.subsector || '-'}</h4>
              </span>
            </div>
            <h4 className="m-0">{activity.title}</h4>
          </li>
        )
      })}
    </ul>
  )
}
