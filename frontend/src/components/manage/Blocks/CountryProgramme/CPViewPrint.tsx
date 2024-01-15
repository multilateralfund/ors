'use client'
import React, { useEffect, useMemo } from 'react'

import { Typography } from '@mui/material'
import { filter } from 'lodash'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import { parseNumber } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import { getViewSections, variants } from '.'

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

export default function CPViewPrint(props: { id: string }) {
  const { fetchBundle, report, setReport } = useStore(
    (state) => state.cp_reports,
  )
  const id = useMemo(() => parseNumber(props.id), [props.id])
  const variant = useMemo(() => {
    if (!report.data) return null
    return filter(variants, (variant) => {
      const year = report.data?.year
      return variant.minYear <= year && variant.maxYear >= year
    })[0]
  }, [report.data])
  const sections = useMemo(
    () => (variant ? getViewSections(variant) : []),
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
    fetchBundle(id)
  }, [id, fetchBundle])

  return (
    <div className="mx-4">
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!report.error && report.loading}
      />
      {!!report.error && <Error error={report.error} />}
      {report.loaded && !!report.data && (
        <HeaderTitle memo={report.data.status}>
          <div className="mb-4 min-h-[40px]">
            <Typography className="text-white" component="h1" variant="h3">
              {report.data.name}
            </Typography>
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
