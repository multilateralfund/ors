'use client'
import { useMemo } from 'react'
import ReactCountryFlag from 'react-country-flag'

import { Box, Button, Grid, Typography } from '@mui/material'
import cx from 'classnames'
// @ts-ignore
import getCountryISO2 from 'country-iso-3-to-2'
import { find } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { useStore } from '@ors/store'

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

export default function PSView(props: { data: any }) {
  const { data } = props
  const commonSlice = useStore((state) => state.common)

  const country = useMemo(() => {
    return find(
      commonSlice.countries.data,
      (country) => country.name === data.country,
    )
  }, [commonSlice.countries, data.country])

  console.log('HERE', data)

  return (
    <>
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          {data.title}
        </Typography>
      </HeaderTitle>
      <Grid spacing={2} container>
        <Grid lg={9} xs={12} item>
          <Box>
            <Label>Country</Label>
            <Typography className="flex items-center justify-between text-lg font-bold">
              <span>
                <ReactCountryFlag
                  className="mr-1 !text-[40px]"
                  countryCode={getCountryISO2(country.iso3)}
                />
                <span className="country-name">{country.name}</span>
              </span>
              <span className="country-iso3">{country.iso3}</span>
            </Typography>
            <Divider />
            <div className="mb-4">
              <Label>Project description</Label>
              <Typography>{data.description || '-'}</Typography>
            </div>
            <div>
              <Label>Approval meeting</Label>
              <Typography className="text-lg font-bold">
                {data.approval_meeting || '-'}
              </Typography>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label>Lead Agency</Label>
                <Typography className="text-lg font-bold">
                  {data.agency}
                </Typography>
              </div>
              <div>
                <Label>Cooperating agencies</Label>
                <Typography className="text-lg font-bold">
                  {data.coop_agencies.join(', ') || '-'}
                </Typography>
              </div>
              <div>
                <Label>Sector</Label>
                <Typography className="text-lg font-bold">
                  {data.sector}
                </Typography>
              </div>
              <div>
                <Label>Subsector</Label>
                <Typography className="text-lg font-bold">
                  {data.subsector}
                </Typography>
              </div>
              <div>
                <Label>Type</Label>
                <Typography className="text-lg font-bold">
                  {data.project_type}
                </Typography>
              </div>
              <div>
                <Label>HFC/HCFC</Label>
                <Typography className="text-lg font-bold">
                  {data.substance_type}
                </Typography>
              </div>
              <div>
                <Label>Substances</Label>
                <Typography className="text-lg font-bold">
                  {data.substance_type}
                </Typography>
              </div>
            </div>
            <Divider />
            <div className="grid grid-cols-2 md:grid-cols-4">
              <div>
                <Label>Funds allocated</Label>
                <Typography className="font-bold text-primary">
                  {data.funds_allocated.toLocaleString()}
                </Typography>
              </div>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label>Code</Label>
                <Typography className="font-bold">
                  {data.code || '-'}
                </Typography>
              </div>
              <div>
                <Label>Multi year</Label>
                <Typography className="font-bold">
                  {data.multi_year ? 'yes' : 'no'}
                </Typography>
              </div>
              <div>
                <Label>MYA subsector</Label>
                <Typography className="font-bold">
                  {data.mya_subsector || '-'}
                </Typography>
              </div>
              <div>
                <Label>Stage</Label>
                <Typography className="font-bold">
                  {data.stage || '-'}
                </Typography>
              </div>
              {/* <div>
                <Label>Category</Label>
                <Typography className="font-bold">
                  {data.submission.category || '-'}
                </Typography>
              </div>

              <div>
                <Label>Programme officer</Label>
                <Typography className="font-bold">
                  {data.submission.programme_officer || '-'}
                </Typography>
              </div>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label>Received</Label>
                <Typography className="font-bold">
                  {data.submission.date_received || '-'}
                </Typography>
              </div>
              <div>
                <Label>Revision</Label>
                <Typography className="font-bold">
                  {data.submission.date_of_revision || '-'}
                </Typography>
              </div> */}
              <div>
                <Label>Project duration</Label>
                <Typography className="font-bold">
                  {data.project_duration || '-'}
                </Typography>
              </div>
              <div>
                <Label>Completion</Label>
                <Typography className="font-bold">
                  {data.date_completion || '-'}
                </Typography>
              </div>
            </div>
            <Divider />
            <Typography className="mb-4 text-typography-secondary" variant="h5">
              Project feedback
            </Typography>
            <div className="history-info mb-8">
              <Label>Submission file</Label>
              <Typography>-</Typography>
            </div>
            <div className="history-info mb-8">
              <Label>Submission with comments</Label>
              <Typography>-</Typography>
            </div>
            <div className="history-info mb-8">
              <Label>Remarks</Label>
              <Field
                placeholder="Add your remarks here"
                type="textarea"
                disabled
              />
            </div>
            <Button variant="contained" disabled>
              Request changes
            </Button>
            <Divider />
          </Box>
        </Grid>
        <Grid lg={3} xs={12} item>
          <Box className="lg:border-none lg:bg-transparent lg:shadow-none">
            <Typography className="mb-4 text-typography-faded" variant="h5">
              Project decision
            </Typography>
            <Button className="ltr:mr-4 rtl:ml-4" variant="contained">
              Initiate approval
            </Button>
            <Button
              className="ltr:mr-4 rtl:ml-4"
              color="secondary"
              variant="contained"
            >
              Reject
            </Button>
            <Divider />
            <Typography className="mb-4 text-typography-secondary" variant="h5">
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
            <Typography className="mb-4 text-typography-secondary" variant="h5">
              File history
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  )
}
