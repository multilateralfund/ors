import Table from '@ors/components/manage/Form/Table'
import {
  booleanDetailItem,
  dateDetailItem,
  detailItem,
  numberDetailItem,
} from './ViewHelperComponents'
import { tableColumns } from '../constants'

import { Divider, Typography } from '@mui/material'

const ProjectOverview = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {detailItem(tableColumns.submission_status, data.submission_status)}
        {detailItem(tableColumns.project_status, data.status)}
        {detailItem(tableColumns.country, data.country)}
        {detailItem(tableColumns.metacode, data.metaproject_code)}
        {detailItem('Metaproject category', data.metaproject_category)}
        {detailItem(tableColumns.cluster, data.cluster?.name)}
        {detailItem(tableColumns.tranche, data.tranche)}
        {detailItem(tableColumns.type, data.project_type?.name)}
        {detailItem(tableColumns.sector, data.sector?.name)}
        {detailItem('Subsector', data.subsector)}
        {detailItem('Meeting', data.meeting)}
        {detailItem('Transfer meeting', data.meeting_transf)}
      </div>
      <Divider />
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {detailItem('Serial number', data.serial_number)}
        {detailItem('Correspondance number', data.correspondance_no)}
        {detailItem('Business plan activity id', data.bp_activity)}
        {detailItem('Stage', data.stage)}
        {detailItem('Compliance', data.compliance)}
        {detailItem('MYA code', data.mya_code)}
        {detailItem('MYA subsector', data.mya_subsector)}
        {numberDetailItem('Local ownership', data.local_ownership)}
        {numberDetailItem('Export to', data.export_to)}
        {numberDetailItem('Total PSC transferred', data.total_psc_transferred)}
      </div>
      <Divider />
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {booleanDetailItem('Umbrella project', data.umbrella_project)}
        {booleanDetailItem('Loan', data.loan)}
        {booleanDetailItem(
          'Intersessional approval',
          data.intersessional_approval,
        )}
        {booleanDetailItem('Retroactive finance', data.retroactive_finance)}
        {booleanDetailItem('Withdrawn', data.withdrawn)}
        {booleanDetailItem('Incomplete', data.incomplete)}
        {booleanDetailItem('Reviewed MLFS', data.reviewed_mfs)}
        {booleanDetailItem('Plus', data.plus)}
      </div>
      <Divider />
      {detailItem('Implementing agency', data.lead_agency)}
      {detailItem(
        'Cooperating agencies',
        data.coop_agencies.map((agency: any) => agency.name)?.join(', ') || '-',
      )}
      {detailItem('National agency', data.national_agency)}
      {detailItem('Programme officer', data.programme_officer)}
      <Divider />
      {detailItem(tableColumns.title, data.title)}
      {detailItem('Description', data.description, 'self-start')}
      {detailItem('Excom provision', data.excom_provision, 'self-start')}
      {detailItem('Remarks', data.remarks)}
      {detailItem('Agency remarks', data.agency_remarks)}
      <span>Comments</span>
      {data.comments.length > 0
        ? data.comments?.map((comment: any) => (
            <div key={comment.id}>
              <Typography className="mb-4">
                <span className="text-lg text-primary">Secretariat:</span>{' '}
                {comment.secretariat_comment}
              </Typography>
              <Typography className="mb-4">
                <span className="text-lg text-primary">Agency response:</span>{' '}
                {comment.agency_response}
              </Typography>
            </div>
          ))
        : '-'}
      <Divider />
      {booleanDetailItem('Issue', data.issue)}
      {data.issue &&
        detailItem('Issue description', data.issue_description, 'self-start')}
      {detailItem('Plan', data.plan, 'self-start')}
      {detailItem('Technology', data.technology)}
      {detailItem('Application', data.application)}
      {detailItem('Products manufactured', data.products_manufactured)}
      <span>RBM measures</span>
      <Table
        className="mb-4"
        enablePagination={false}
        rowData={data.rbm_measures}
        suppressCellFocus={false}
        withSeparators={true}
        columnDefs={[
          {
            field: 'measure_name',
            headerName: 'Measure',
            initialWidth: 140,
            minWidth: 140,
          },
          {
            field: 'value',
            headerName: 'Unit',
            initialWidth: 120,
            minWidth: 120,
          },
        ]}
        getRowId={(props: any) => {
          return props.data.id
        }}
      />
      <Divider />
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {detailItem('Project duration', data.project_duration)}
        {numberDetailItem('Total grant', data.total_grant)}
        {dateDetailItem('Date received', data.date_received)}
        {dateDetailItem('Date approved', data.date_approved)}
        {dateDetailItem('Date actual', data.date_actual)}
        {dateDetailItem('Date per agreement', data.date_per_agreement)}
        {dateDetailItem('Date per decision', data.date_per_decision)}
        {dateDetailItem('Date completion', data.date_completion)}
        {dateDetailItem('Date completion revised', data.date_comp_revised)}
        {dateDetailItem('Date of revision', data.date_of_revision)}
        {detailItem('Revision number', data.revision_number)}
      </div>
    </div>
  )
}

export default ProjectOverview
