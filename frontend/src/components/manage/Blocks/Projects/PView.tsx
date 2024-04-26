'use client'
import { ProjectType } from '@ors/types/api_projects'

import { useMemo } from 'react'
import ReactCountryFlag from 'react-country-flag'

import { Box, Button, Grid, Typography } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'
import { find } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { useStore } from '@ors/store'

type ProjectProps = {
  data: ProjectType
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Typography className={cx('mb-1 text-typography-faded', className)}>
      {children}
    </Typography>
  )
}

function Divider() {
  return <div className="my-8 h-[1px] w-full bg-gray-200 bg-opacity-30" />
}

export default function PView({ data }: ProjectProps) {
  const countries = useStore((state) => state.common.countries.data)

  const country = useMemo(() => {
    return find(countries, (country) => country.name === data.country)
  }, [countries, data.country])

  return (
    <>
      <HeaderTitle>
        <Typography component="h1" variant="h3">
          {data.title}
        </Typography>
      </HeaderTitle>
      <Grid spacing={2} container>
        <Grid lg={9} xs={12} item>
          <Box>
            <div>
              <Label>Country</Label>
              <div className="flex items-center justify-between">
                <Typography className="text-lg font-bold">
                  <ReactCountryFlag
                    className="mr-1 !text-[32px]"
                    countryCode={country?.abbr || data.country}
                  />
                  {country?.name || data.country}
                </Typography>
                <Typography className="text-lg font-bold">
                  MTG. {data.approval_meeting}
                </Typography>
              </div>
            </div>
            <Divider />
            <div className="mb-4">
              <Label>Project description</Label>
              <Typography>{data.description || '-'}</Typography>
            </div>
            <div className="mb-4">
              <Label>Excom provision</Label>
              <Typography>{data.excom_provision || '-'}</Typography>
            </div>
            <div className="mb-4">
              <Label>Completion by</Label>
              <Typography className="text-lg font-bold">
                {(data.date_completion &&
                  dayjs(data.date_completion).format('ll')) ||
                  '-'}
              </Typography>
            </div>
            <div className="mb-4">
              <Label>Project duration</Label>
              <Typography className="text-lg font-bold">
                {data.project_duration || '-'}
              </Typography>
            </div>
            <div className="mb-4">
              <Label>Lead agency</Label>
              <Typography className="text-lg font-bold">
                {data.agency}
              </Typography>
            </div>
            <div className="mb-4">
              <Label>National agency</Label>
              <Typography className="text-lg font-bold">
                {data.national_agency}
              </Typography>
            </div>
            <div>
              <Label>Cooperating agencies</Label>
              <Typography className="text-lg font-bold">
                {data.coop_agencies.join(', ') || '-'}
              </Typography>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label>Sector</Label>
                <Typography className="text-lg font-bold">
                  {data.sector || '-'}
                </Typography>
              </div>
              <div>
                <Label>Subsector</Label>
                <Typography className="text-lg font-bold">
                  {data.subsector || '-'}
                </Typography>
              </div>
              <div>
                <Label>Mya subsector</Label>
                <Typography className="text-lg font-bold">
                  {data.mya_subsector || '-'}
                </Typography>
              </div>
              <div>
                <Label>Type</Label>
                <Typography className="text-lg font-bold">
                  {data.project_type || '-'}
                </Typography>
              </div>
              <div>
                <Label>Substance type</Label>
                <Typography className="text-lg font-bold">
                  {data.substance_type || '-'}
                </Typography>
              </div>
              <div>
                <Label>Substance category</Label>
                <Typography className="text-lg font-bold">
                  {data.substance_category || '-'}
                </Typography>
              </div>
            </div>
            <Divider />
            <div>
              <Label>Funds allocated</Label>
              <Typography className="text-lg font-bold text-primary">
                {data.funds_allocated?.toLocaleString() || '-'}
              </Typography>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label>Code</Label>
                <Typography className="text-lg font-bold">
                  {data.code || '-'}
                </Typography>
              </div>
              <div>
                <Label>Mya code</Label>
                <Typography className="text-lg font-bold">
                  {data.mya_code || '-'}
                </Typography>
              </div>
              <div>
                <Label>Serial number</Label>
                <Typography className="text-lg font-bold">
                  {data.serial_number || '-'}
                </Typography>
              </div>
              <div>
                <Label>Cluster</Label>
                <Typography className="text-lg font-bold">
                  {data.cluster || '-'}
                </Typography>
              </div>
              <div>
                <Label>Stage</Label>
                <Typography className="text-lg font-bold">
                  {data.stage || '-'}
                </Typography>
              </div>
              <div>
                <Label>Trance</Label>
                <Typography className="text-lg font-bold">
                  {data.tranche || '-'}
                </Typography>
              </div>
              <div>
                <Label>Compliance</Label>
                <Typography className="text-lg font-bold">
                  {data.compliance || '-'}
                </Typography>
              </div>
              <div>
                <Label>Meeting transf</Label>
                <Typography className="text-lg font-bold">
                  {data.meeting_transf || '-'}
                </Typography>
              </div>
              <div>
                <Label>Application</Label>
                <Typography className="text-lg font-bold">
                  {data.application || '-'}
                </Typography>
              </div>
              <div>
                <Label>Products manufactured</Label>
                <Typography className="text-lg font-bold">
                  {data.products_manufactured || '-'}
                </Typography>
              </div>
              <div>
                <Label>Plan</Label>
                <Typography className="text-lg font-bold">
                  {data.plan || '-'}
                </Typography>
              </div>
              <div>
                <Label>Technology</Label>
                <Typography className="text-lg font-bold">
                  {data.technology || '-'}
                </Typography>
              </div>
              <div>
                <Label>Impact</Label>
                <Typography className="text-lg font-bold">
                  {data.impact || '-'}
                </Typography>
              </div>
              <div>
                <Label>Impact CO2MT</Label>
                <Typography className="text-lg font-bold">
                  {data.impact_co2mt || '-'}
                </Typography>
              </div>
              <div>
                <Label>Impact production</Label>
                <Typography className="text-lg font-bold">
                  {data.impact_production || '-'}
                </Typography>
              </div>
              <div>
                <Label>Impact production CO@MT</Label>
                <Typography className="text-lg font-bold">
                  {data.impact_prod_co2mt || '-'}
                </Typography>
              </div>
              <div>
                <Label>Substance phasedout</Label>
                <Typography className="text-lg font-bold">
                  {data.substance_phasedout || '-'}
                </Typography>
              </div>
              <div>
                <Label>ODS phasedout CO2MT</Label>
                <Typography className="text-lg font-bold">
                  {data.ods_phasedout_co2mt || '-'}
                </Typography>
              </div>
              <div>
                <Label>HCFC stage</Label>
                <Typography className="text-lg font-bold">
                  {data.hcfc_stage || '-'}
                </Typography>
              </div>
              <div>
                <Label>Capital cost</Label>
                <Typography className="text-lg font-bold">
                  {data.capital_cost || '-'}
                </Typography>
              </div>
              <div>
                <Label>Operating cost</Label>
                <Typography className="text-lg font-bold">
                  {data.operating_cost || '-'}
                </Typography>
              </div>
              <div>
                <Label>Effectivness cost</Label>
                <Typography className="text-lg font-bold">
                  {data.effectiveness_cost || '-'}
                </Typography>
              </div>
              <div>
                <Label>Contingency cost</Label>
                <Typography className="text-lg font-bold">
                  {data.contingency_cost || '-'}
                </Typography>
              </div>
              <div>
                <Label>Total fund transferred</Label>
                <Typography className="text-lg font-bold">
                  {data.total_fund_transferred || '-'}
                </Typography>
              </div>
              <div>
                <Label>Total psc transfered</Label>
                <Typography className="text-lg font-bold">
                  {data.total_psc_transferred || '-'}
                </Typography>
              </div>
              <div>
                <Label>Total fund approved</Label>
                <Typography className="text-lg font-bold">
                  {data.total_fund_approved || '-'}
                </Typography>
              </div>
              <div>
                <Label>Total psc cost</Label>
                <Typography className="text-lg font-bold">
                  {data.total_psc_cost || '-'}
                </Typography>
              </div>
              <div>
                <Label>Total grant</Label>
                <Typography className="text-lg font-bold">
                  {data.total_grant || '-'}
                </Typography>
              </div>
              <div>
                <Label>Fund disbursed</Label>
                <Typography className="text-lg font-bold">
                  {data.fund_disbursed || '-'}
                </Typography>
              </div>
              <div>
                <Label>Fund disbursed_psc</Label>
                <Typography className="text-lg font-bold">
                  {data.fund_disbursed_psc || '-'}
                </Typography>
              </div>
              <div>
                <Label>Date approved</Label>
                <Typography className="text-lg font-bold">
                  {data.date_approved || '-'}
                </Typography>
              </div>
              <div>
                <Label>Date actual</Label>
                <Typography className="text-lg font-bold">
                  {data.date_actual || '-'}
                </Typography>
              </div>
              <div>
                <Label>Date comp revised</Label>
                <Typography className="text-lg font-bold">
                  {data.date_comp_revised || '-'}
                </Typography>
              </div>
              <div>
                <Label>Date per agreement</Label>
                <Typography className="text-lg font-bold">
                  {data.date_per_agreement || '-'}
                </Typography>
              </div>
              <div>
                <Label>Date per decision</Label>
                <Typography className="text-lg font-bold">
                  {data.date_per_decision || '-'}
                </Typography>
              </div>
              <div>
                <Label>Date received</Label>
                <Typography className="text-lg font-bold">
                  {data.date_received || '-'}
                </Typography>
              </div>
              <div>
                <Label>Submission category</Label>
                <Typography className="text-lg font-bold">
                  {data.submission_category || '-'}
                </Typography>
              </div>
              <div>
                <Label>Submission number</Label>
                <Typography className="text-lg font-bold">
                  {data.submission_number || '-'}
                </Typography>
              </div>
              <div>
                <Label>Programme officer</Label>
                <Typography className="text-lg font-bold">
                  {data.programme_officer || '-'}
                </Typography>
              </div>
              <div>
                <Label>Support cost psc</Label>
                <Typography className="text-lg font-bold">
                  {data.support_cost_psc || '-'}
                </Typography>
              </div>
              <div>
                <Label>Project cost</Label>
                <Typography className="text-lg font-bold">
                  {data.project_cost || '-'}
                </Typography>
              </div>
              <div>
                <Label>Umbrella project</Label>
                <Typography className="text-lg font-bold">
                  {data.umbrella_project || '-'}
                </Typography>
              </div>
              <div>
                <Label>Loan</Label>
                <Typography className="text-lg font-bold">
                  {data.loan || '-'}
                </Typography>
              </div>
              <div>
                <Label>Intersessional approval</Label>
                <Typography className="text-lg font-bold">
                  {data.intersessional_approval || '-'}
                </Typography>
              </div>
              <div>
                <Label>Retroactive finance</Label>
                <Typography className="text-lg font-bold">
                  {data.retroactive_finance || '-'}
                </Typography>
              </div>
              <div>
                <Label>Revision number</Label>
                <Typography className="text-lg font-bold">
                  {data.revision_number || '-'}
                </Typography>
              </div>
              <div>
                <Label>Date of revision</Label>
                <Typography className="text-lg font-bold">
                  {data.date_of_revision || '-'}
                </Typography>
              </div>
              <div>
                <Label>Agency remarks</Label>
                <Typography className="text-lg font-bold">
                  {data.agency_remarks || '-'}
                </Typography>
              </div>
              <div>
                <Label>Withdrawn</Label>
                <Typography className="text-lg font-bold">
                  {data.withdrawn || '-'}
                </Typography>
              </div>
              <div>
                <Label>Incomplete</Label>
                <Typography className="text-lg font-bold">
                  {data.incomplete || '-'}
                </Typography>
              </div>
              <div>
                <Label>Issue</Label>
                <Typography className="text-lg font-bold">
                  {data.issue || '-'}
                </Typography>
              </div>
              <div>
                <Label>Issue description</Label>
                <Typography className="text-lg font-bold">
                  {data.issue_description || '-'}
                </Typography>
              </div>
              <div>
                <Label>Local ownership</Label>
                <Typography className="text-lg font-bold">
                  {data.local_ownership || '-'}
                </Typography>
              </div>
              <div>
                <Label>Export to</Label>
                <Typography className="text-lg font-bold">
                  {data.export_to || '-'}
                </Typography>
              </div>
              <div>
                <Label>Correspondance number</Label>
                <Typography className="text-lg font-bold">
                  {data.correspondance_no || '-'}
                </Typography>
              </div>
              <div>
                <Label>Submission comments</Label>
                <Typography className="text-lg font-bold">
                  {data.submission_comments || '-'}
                </Typography>
              </div>
              <div>
                <Label>Plus</Label>
                <Typography className="text-lg font-bold">
                  {data.plus || '-'}
                </Typography>
              </div>
              <div>
                <Label>Remarks</Label>
                <Typography className="text-lg font-bold">
                  {data.remarks || '-'}
                </Typography>
              </div>
            </div>
            <Divider />
            <Typography className="mb-4 text-typography-faded" variant="h4">
              ODS ODP
            </Typography>
            <Table
              className="mb-4"
              enablePagination={false}
              rowData={data.ods_odp}
              suppressCellFocus={false}
              suppressNoRowsOverlay={true}
              withSeparators={true}
              columnDefs={[
                {
                  field: 'ods_display_name',
                  headerName: 'Substance',
                  initialWidth: 140,
                  minWidth: 140,
                },
                {
                  field: 'ods_replacement',
                  headerName: 'Replacement',
                  initialWidth: 120,
                  minWidth: 120,
                },
                {
                  dataType: 'number',
                  field: 'odp',
                  headerName: 'ODP',
                  initialWidth: 120,
                  minWidth: 120,
                },
                {
                  dataType: 'number',
                  field: 'co2_mt',
                  headerName: 'CO2MT',
                  initialWidth: 120,
                  minWidth: 120,
                },
                {
                  field: 'ods_type',
                  headerName: 'ODS type',
                  initialWidth: 120,
                  minWidth: 120,
                },
              ]}
              getRowId={(props: any) => {
                return props.data.id
              }}
            />
            <Typography className="mb-4 text-typography-faded" variant="h4">
              Funds
            </Typography>
            <Table
              className="mb-4"
              enablePagination={false}
              rowData={data.funds}
              suppressCellFocus={false}
              suppressNoRowsOverlay={true}
              withSeparators={true}
              columnDefs={[
                {
                  field: 'fund_type',
                  headerName: 'Type',
                  initialWidth: 140,
                  minWidth: 140,
                },
                {
                  field: 'meeting',
                  headerName: 'Meeting',
                  initialWidth: 140,
                  minWidth: 140,
                },
                {
                  dataType: 'number',
                  field: 'amount',
                  headerName: 'Amount',
                  initialWidth: 120,
                  minWidth: 120,
                },
                {
                  dataType: 'number',
                  field: 'support_psc',
                  headerName: 'Support psc',
                  initialWidth: 120,
                  minWidth: 120,
                },
                {
                  field: 'interest',
                  headerName: 'Interest',
                  initialWidth: 120,
                  minWidth: 120,
                },
                {
                  dataType: 'date',
                  field: 'date',
                  headerName: 'Date',
                  initialWidth: 120,
                  minWidth: 120,
                },
              ]}
              getRowId={(props: any) => {
                return props.data.id
              }}
            />
            <Typography className="mb-4 text-typography-faded" variant="h4">
              RBM measures
            </Typography>
            <Table
              className="mb-4"
              enablePagination={false}
              rowData={data.rbm_measures}
              suppressCellFocus={false}
              suppressNoRowsOverlay={true}
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
            <Typography className="mb-4 text-typography-faded" variant="h4">
              Comments
            </Typography>
            {data.comments?.map((comment: any) => (
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
            ))}
          </Box>
        </Grid>
        <Grid lg={3} xs={12} item>
          <Box className="lg:border-none lg:bg-transparent lg:shadow-none">
            <Typography className="mb-4 text-typography-faded" variant="h5">
              Project decision
            </Typography>
            <Button className="mr-4" variant="contained">
              Initiate approval
            </Button>
            <Button className="mr-4" color="secondary" variant="contained">
              Reject
            </Button>
            <Divider />
            <Typography className="mb-4 text-typography-faded" variant="h5">
              Submission history
            </Typography>
            <div className="history-info mb-4">
              <Label>Submitted</Label>
              <Typography>-</Typography>
            </div>
            <div className="history-info mb-4">
              <Label>Reviewed</Label>
              <Typography>-</Typography>
            </div>
            <div className="history-info mb-8">
              <Label>Last updated</Label>
              <Typography>-</Typography>
            </div>
            <Typography className="mb-4 text-typography-faded" variant="h5">
              File history
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  )
}
