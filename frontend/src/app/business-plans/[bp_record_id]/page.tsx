'use client'

import { useMemo } from 'react'

import { Box, Grid, Typography } from '@mui/material'
import cx from 'classnames'
import { groupBy } from 'lodash'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

type BPRecordProps = {
  params: {
    bp_record_id: string
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

export default function BPRecord({ params }: BPRecordProps) {
  const bpSlice = useStore((state) => state.businessPlans)
  const { data, loaded } = useApi({
    options: {},
    path: `api/business-plan-record/${params.bp_record_id}/`,
  })
  const valuesByYear = groupBy(data?.values || [], 'year')

  const yearRangeSelected = bpSlice.yearRanges.data.find(
    (item: any) => item.year_start === data?.business_plan.year_start,
  )
  const values = useMemo(() => {
    if (!yearRangeSelected) return []

    const result = []

    for (
      let year = yearRangeSelected.min_year;
      year <= yearRangeSelected.max_year;
      year++
    ) {
      let label = year
      if (year === yearRangeSelected.max_year) {
        label = `After ${year - 1}`
      }

      result.push({
        label,
        year,
        ...valuesByYear[year]?.[0],
      })
    }
    return result
  }, [valuesByYear, yearRangeSelected])

  return (
    loaded && (
      <PageWrapper>
        <HeaderTitle>
          <Typography className="text-white" component="h1" variant="h3">
            Business Plan Record view page
          </Typography>
        </HeaderTitle>
        <Grid spacing={2} container>
          <Grid lg={9} xs={12} item>
            <Box>
              <Label>Title</Label>
              <Typography className="mb-8" component="h1" variant="h5">
                {data.title}
              </Typography>
              <Divider />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <Label>Country</Label>
                  <Typography className="font-bold">
                    {data.country?.name || '-'}
                  </Typography>
                </div>
                <div>
                  <Label>Agency</Label>
                  <Typography className="font-bold">
                    {data.business_plan.agency.name}
                  </Typography>
                </div>
                <div>
                  <Label>Status</Label>
                  <Typography className="font-bold">
                    {data.business_plan.status}
                  </Typography>
                </div>
                <div>
                  <Label>Required by model</Label>
                  <Typography className="font-bold">
                    {data.required_by_model}
                  </Typography>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <Label>HCFC Status (LVC, non-LVC)</Label>
                  <Typography className="font-bold">
                    {data.lvc_status}
                  </Typography>
                </div>
                <div>
                  <Label>Type</Label>
                  <Typography className="font-bold">
                    {data.project_type.name}
                  </Typography>
                </div>
                <div>
                  <Label>BP Chemical Type</Label>
                  <Typography className="font-bold">
                    {data.bp_chemical_type.name}
                  </Typography>
                </div>
                <div>
                  <Label>Amount of Polyol in Project (MT)</Label>
                  <Typography className="font-bold">
                    {data.amount_polyol ?? '-'}
                  </Typography>
                </div>
                <div>
                  <Label>Sector</Label>
                  <Typography className="font-bold">
                    {data.sector?.name || '-'}
                  </Typography>
                </div>
                <div>
                  <Label>Subsector</Label>
                  <Typography className="font-bold">
                    {data.subsector?.name || '-'}
                  </Typography>
                </div>
                <div>
                  <Label>Approved / Planned</Label>
                  <Typography className="font-bold">
                    {data.bp_type_display}
                  </Typography>
                </div>
                <div>
                  <Label>Individual / Multi-Year</Label>
                  <Typography className="font-bold">
                    {data.is_multi_year_display}
                  </Typography>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Substances</Label>
                  <Typography className="font-bold">
                    {data.substances.join(' / ') || '-'}
                  </Typography>
                </div>
                <div>
                  <Label>Blends</Label>
                  <Typography className="font-bold">
                    {data.blends.join(' / ') || '-'}
                  </Typography>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Reason for exceeding 67.5% of baseline</Label>
                  <Typography className="font-bold">
                    {data.reason_for_exceeding || '-'}
                  </Typography>
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Typography className="font-bold">
                    {data.remarks || '-'}
                  </Typography>
                </div>
                <div>
                  <Label>Additional Remarks</Label>
                  <Typography className="font-bold">
                    {data.remarks_additional || '-'}
                  </Typography>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-3 gap-4">
                {values.map((item: any) => (
                  <>
                    <div>
                      <Label>Value ($000) {item.label}</Label>
                      <Typography className="font-bold">
                        {item.value_usd ? parseFloat(item.value_usd) : '-'}
                      </Typography>
                    </div>
                    <div>
                      <Label>ODP {item.label}</Label>
                      <Typography className="font-bold">
                        {item.value_odp ? parseFloat(item.value_odp) : '-'}
                      </Typography>
                    </div>
                    <div>
                      <Label>MT {item.label} for HFC</Label>
                      <Typography className="font-bold">
                        {item.value_mt ? parseFloat(item.value_mt) : '-'}
                      </Typography>
                    </div>
                  </>
                ))}
              </div>
            </Box>
          </Grid>
        </Grid>
      </PageWrapper>
    )
  )
}
