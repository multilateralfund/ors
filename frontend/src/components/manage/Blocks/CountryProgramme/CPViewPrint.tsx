'use client'
import { useEffect, useMemo } from 'react'

import { Typography } from '@mui/material'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import { useStore } from '@ors/store'

import { getSections } from '.'

const TableProps = {
  Toolbar: ({ section }: any) => {
    return (
      <div className="mb-4">
        <Typography component="h2" variant="h6">
          {section.title}
        </Typography>
      </div>
    )
  },
  domLayout: 'print',
  enableCellChangeFlash: true,
  enablePagination: false,
  noRowsOverlayComponentParams: { label: 'No data reported' },
  suppressCellFocus: false,
  suppressColumnVirtualisation: true,
  suppressRowHoverHighlight: false,
  withSeparators: true,
  withSkeleton: true,
}

export default function CPViewPrint(props: { iso3: string; year: number }) {
  const { iso3, year } = props
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const country = countries.filter((country) => country.iso3 === iso3)[0]

  const { fetchBundle, report, setReport } = useStore(
    (state) => state.cp_reports,
  )
  const variant = useMemo(() => report.variant, [report])
  const sections = useMemo(
    () => (variant ? getSections(variant, 'view') : []),
    [variant],
  )

  useEffect(() => {
    return () => {
      setReport({
        ...defaultSliceData,
        emptyForm: defaultSliceData,
        versions: defaultSliceData,
      })
    }
  }, [setReport])

  useEffect(() => {
    fetchBundle(country.id, year, true)
  }, [country, year, fetchBundle])

  return (
    <div className="mx-4">
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!report.error && report.loading}
      />
      {!!report.error && <Error error={report.error} />}
      {report.loaded && !!report.data && (
        <HeaderTitle>
          <div className="mb-4 min-h-[40px]">
            <PageHeading>{report.data.name}</PageHeading>
          </div>
        </HeaderTitle>
      )}
      {report.emptyForm.loaded &&
        sections.map((section) => {
          const Section = section.component

          return (
            <div key={section.panelId} className="print-section mb-8">
              <Section
                TableProps={{ ...TableProps, report, section }}
                emptyForm={report.emptyForm.data || {}}
                report={report.data}
                section={section}
                variant={variant}
              />
            </div>
          )
        })}
    </div>
  )
}
