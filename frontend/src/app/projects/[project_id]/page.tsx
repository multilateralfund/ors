import { Box, Button, Grid, Typography } from '@mui/material'
import cx from 'classnames'
import { sumBy } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/Api'

type ProjectProps = {
  params: {
    project_id: string
  }
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Typography className={cx('mb-2 text-typography-secondary', className)}>
      {children}
    </Typography>
  )
}

function Divider() {
  return <div className="my-8 h-[1px] w-full bg-gray-200 bg-opacity-30" />
}

export default async function Project({ params }: ProjectProps) {
  const data = await api(`api/projects/${params.project_id}/`, {}, false)

  return (
    <PageWrapper>
      <HeaderTitle>
        <Label className="dark">Project title</Label>
        <Typography className="text-white" component="h1" variant="h3">
          {data.title}
        </Typography>
      </HeaderTitle>
      <Grid spacing={2} container>
        <Grid lg={8} xs={12} item>
          <Box>
            <Label>Country</Label>
            <Typography>{data.country}</Typography>
            <Divider />
            <Label>Project description</Label>
            <Typography>{data.description}</Typography>
            <Divider />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label>Lead Agency</Label>
                <Typography className="font-bold">{data.agency}</Typography>
              </div>
              <div>
                <Label>Cooperating agencies</Label>
                <Typography className="font-bold">
                  {data.coop_agencies.join(', ') || '-'}
                </Typography>
              </div>
              <div>
                <Label>Sector</Label>
                <Typography className="font-bold">{data.sector}</Typography>
              </div>
              <div>
                <Label>Subsector</Label>
                <Typography className="font-bold">{data.subsector}</Typography>
              </div>
              <div>
                <Label>Type</Label>
                <Typography className="font-bold">
                  {data.project_type}
                </Typography>
              </div>
              <div>
                <Label>HFC/HCFC</Label>
                <Typography className="font-bold">
                  {data.substance_type}
                </Typography>
              </div>
              <div>
                <Label>Substances</Label>
                <Typography className="font-bold">
                  {data.substance_type}
                </Typography>
              </div>
            </div>
            <Divider />
            <div className="grid grid-cols-2 md:grid-cols-4">
              <div>
                <Label>Funds requested</Label>
                <Typography className="font-bold text-primary">
                  {sumBy(
                    data.funds,
                    (fund: any) => fund.amount,
                  ).toLocaleString()}
                </Typography>
              </div>
              <div>
                <Label>Supported</Label>
                <Typography className="font-bold text-primary">
                  {sumBy(
                    data.funds,
                    (fund: any) => fund.support_13,
                  ).toLocaleString()}
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
        <Grid lg={4} xs={12} item>
          <Box className="lg:border-none lg:bg-transparent lg:shadow-none">
            <Typography className="mb-4 text-typography-secondary" variant="h5">
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
    </PageWrapper>
  )
}
