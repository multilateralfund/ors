import { useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'

// {
//     "agency": "UNEP",
//     "id": 15411,
//     "title": "Afghanistan HFC Phase down plan preparation ",
//     "required_by_model": "KIP Preparation",
//     "country": {
//         "id": 418,
//         "name": "Afghanistan",
//         "abbr": "AF",
//         "name_alt": "Afghanistan",
//         "iso3": "AFG",
//         "has_cp_report": null,
//         "is_a2": false
//     },
//     "lvc_status": "Non-LVC",
//     "project_type": "PRP",
//     "bp_chemical_type": "HFC",
//     "project_cluster": null,
//     "substances": [],
//     "amount_polyol": null,
//     "sector": null,
//     "subsector": null,
//     "legacy_sector_and_subsector": "HFC Phase Down National Implementation Plans (preparation)",
//     "status": "U",
//     "is_multi_year": false,
//     "reason_for_exceeding": null,
//     "remarks": "UNEP is a lead agency in cooperation with UNIDO. PRP is moved to 2024 due to the political situation",
//     "remarks_additional": null,
//     "values": [
//         {
//             "id": 60329,
//             "year": 2024,
//             "value_usd": "150.290000000000000",
//             "value_odp": null,
//             "value_mt": null
//         },
//         {
//             "id": 84781,
//             "year": 2024,
//             "value_usd": "150.290000000000000",
//             "value_odp": null,
//             "value_mt": null
//         }
//     ],
//     "is_multi_year_display": "Individual",
//     "status_display": "Undefined",
//     "comment_secretariat": ""
// }

function OpenActivity({ activity, period }: any) {
  return (
    <div className="transition-opacity flex w-full flex-col gap-4 opacity-100 duration-300 ease-in-out">
      <h4 className="m-0 border-0 border-b border-solid border-primary pb-4">
        {activity.title}
      </h4>
      <div className="grid grid-cols-2 gap-y-4 md:grid-cols-3 lg:grid-cols-4">
        <span className="flex items-center gap-2">
          <span>Country</span>
          <h4 className="m-0">
            {activity.country.iso3 || activity.country.name_alt}
          </h4>
        </span>
        {period && (
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
          <span>Required by model</span>
          <h4 className="m-0">{activity.required_by_model || '-'}</h4>
        </span>
        <span className="flex items-center gap-2">
          <span>Sector</span>
          <h4 className="m-0">{activity.sector || '-'}</h4>
        </span>
        <span className="flex items-center gap-2">
          <span>Subsector</span>
          <h4 className="m-0">{activity.subsector || '-'}</h4>
        </span>
        <span className="flex items-center gap-2">
          <span>IND/MYA</span>
          <h4 className="m-0">
            {activity.is_multi_year ? 'Multi-Year' : 'Individual'}
          </h4>
        </span>
        <span className="flex items-center gap-2">
          <span>Status</span>
          <h4 className="m-0">{activity.status_display}</h4>
        </span>
      </div>

      <span className="flex items-center gap-4">
        <span>Substances</span>
        {activity.substances.length > 0
          ? activity.substances.map((substance: any, index: number) => (
              <h4 key={index} className="m-0">
                {substance.name}
              </h4>
            ))
          : '-'}
      </span>

      <span className="flex items-center gap-4">
        <span>Polyol amount</span>
        <h4 className="m-0">{activity.amount_polyol || '-'}</h4>
      </span>
    </div>
  )
}

function ClosedActivity({ activity, period }: any) {
  return (
    <div className="transition-opacity flex w-full flex-col-reverse lg:flex-row justify-between gap-4 opacity-100 duration-300 ease-in-out">
      <div className="flex items-center flex-wrap gap-4">
        <span className="flex items-center gap-2">
          <span>Country</span>
          <h4 className="m-0">
            {activity.country.iso3 || activity.country.name_alt}
          </h4>
        </span>
        {period && (
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
    </div>
  )
}

function Activity({ activity, period }: any) {
  const [open, setOpen] = useState(false)

  return (
    <li
      className="transition-transform w-full transform cursor-pointer rounded-lg p-4 duration-300 ease-in-out"
      style={{ boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.2)' }}
      onClick={() => setOpen(!open)}
    >
      {open ? (
        <OpenActivity activity={activity} period={period} />
      ) : (
        <ClosedActivity activity={activity} period={period} />
      )}
    </li>
  )
}

export default function Activities(props: any) {
  const { loaded, period, results } = props

  if (!loaded) {
    return <Loading />
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-6 pl-0">
      {results.map((activity: any) => (
        <Activity key={activity.id} activity={activity} period={period} />
      ))}
    </ul>
  )
}
