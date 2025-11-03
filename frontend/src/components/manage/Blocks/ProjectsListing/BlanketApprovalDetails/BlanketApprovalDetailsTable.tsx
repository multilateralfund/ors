import {
  ApiBlanketApprovalDetailsCountryData,
  ApiBlanketApprovalDetailsCountryEntry,
  ApiBlanketApprovalDetailsProject,
  GlobalRequestParams,
} from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/types.ts'
import React from 'react'
import useBlanketApprovalDetails from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/useBlanketApprovalDetails.ts'
import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils.ts'

const dollarValueOrNull = (value: number | string) =>
  value ? `$${formatNumberValue(value)}` : null

const numberValueOrNull = (value: number | string) =>
  value ? formatNumberValue(value) : null

type BlanketApprovalDetailsProjectRowProps = {
  project: ApiBlanketApprovalDetailsProject
}

const BlanketApprovalDetailsProjectRow = (
  props: BlanketApprovalDetailsProjectRowProps,
) => {
  const { project } = props
  return (
    <tr>
      <td>
        <div>{project.project_title}</div>
        <div className="italic">{project.project_description}</div>
      </td>
      <td>{project.agency_name}</td>
      <td>{numberValueOrNull(project.hcfc)}</td>
      <td>{numberValueOrNull(project.hfc)}</td>
      <td className="text-right">
        {dollarValueOrNull(project.project_funding)}
      </td>
      <td className="text-right">
        {dollarValueOrNull(project.project_support_cost)}
      </td>
      <td className="text-right">{dollarValueOrNull(project.total)}</td>
    </tr>
  )
}

type BlanketApprovalDetailsCountryClusterProjectProps = {
  countryData: ApiBlanketApprovalDetailsCountryData
}

const BlanketApprovalDetailsCountryClusterProject = (
  props: BlanketApprovalDetailsCountryClusterProjectProps,
) => {
  const { countryData } = props
  return (
    <>
      <tr>
        <th colSpan={7} className="text-left" title="Cluster">
          {countryData.cluster_name}
        </th>
      </tr>
      <tr>
        <th colSpan={7} className="text-left" title="Project type">
          {countryData.project_type_name}
        </th>
      </tr>
      {countryData.projects.map((project) => (
        <BlanketApprovalDetailsProjectRow project={project} />
      ))}
    </>
  )
}

type BlanketApprovalDetailsCountryEntryProps = {
  countryEntry: ApiBlanketApprovalDetailsCountryEntry
}

const BlanketApprovalDetailsCountryEntry = (
  props: BlanketApprovalDetailsCountryEntryProps,
) => {
  const { countryEntry } = props
  return (
    <>
      <tr>
        <th colSpan={7} className="text-left" title="Country name">
          {countryEntry.country_name}
        </th>
      </tr>
      {countryEntry.country_data.map((countryData) => (
        <BlanketApprovalDetailsCountryClusterProject
          key={`${countryData.cluster_name} ${countryData.project_type_name}`}
          countryData={countryData}
        />
      ))}
      <tr>
        <th colSpan={2} className="text-right">
          Total for {countryEntry.country_name}
        </th>
        <th>{numberValueOrNull(countryEntry.country_total.hcfc)}</th>
        <th>{numberValueOrNull(countryEntry.country_total.hfc)}</th>
        <th className="text-right">
          {dollarValueOrNull(countryEntry.country_total.project_funding)}
        </th>
        <th className="text-right">
          {dollarValueOrNull(countryEntry.country_total.project_support_cost)}
        </th>
        <th className="text-right">
          {dollarValueOrNull(countryEntry.country_total.total)}
        </th>
      </tr>
    </>
  )
}

const BlanketApprovalDetailsTable = (props: {
  globalRequestParams: GlobalRequestParams
}) => {
  const { globalRequestParams } = props

  const { response: apiData } = useBlanketApprovalDetails(globalRequestParams)

  return (
    <table className="table w-full border-collapse">
      <thead className="border-2 border-x-0 border-solid border-primary">
        <tr>
          <th className="text-left">Project title</th>
          <th>Agency</th>
          <th>HCFC</th>
          <th>HFC</th>
          <th colSpan={3}>
            Funds {globalRequestParams.submission_status} (US $)
          </th>
        </tr>
        <tr>
          <th></th>
          <th></th>
          <th>(ODP tonnes)</th>
          <th>(CO2-eq '000 tonnes)</th>
          <th className="text-right">Project</th>
          <th className="text-right">Support</th>
          <th className="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {apiData?.result.map((countryEntry) => (
          <BlanketApprovalDetailsCountryEntry
            key={countryEntry.country_name}
            countryEntry={countryEntry}
          />
        ))}
      </tbody>
    </table>
  )
}

export default BlanketApprovalDetailsTable
