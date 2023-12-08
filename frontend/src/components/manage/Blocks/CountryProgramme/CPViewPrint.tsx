'use client'
import React, { useEffect, useMemo } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { filter, noop } from 'lodash'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import { parseNumber } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import { getViewSections, variants } from '.'

import { AiFillFilePdf } from 'react-icons/ai'
import { IoClose, IoDownloadOutline, IoExpand } from 'react-icons/io5'

export default function CPReportView(props: { id: string }) {
  const { fetchBundle, report, setReport } = useStore(
    (state) => state.cp_reports,
  )
  const id = useMemo(() => parseNumber(props.id), [props.id])
  const variant = useMemo(
    () =>
      // TODO: Check why the fuck typescript is saying report.data is null
      // when I make sure that I filter only if report.data exists :/
      report.data &&
      filter(variants, (variant) => {
        const year = report.data?.year
        return variant.minYear <= year && variant.maxYear >= year
      })[0],
    [report.data],
  )
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
    <>
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
      {report.loaded &&
        !!report.data &&
        sections.map((section, index) => {
          const Section = section.component

          return (
            <div key={section.panelId} className="print-section">
              <Section
                activeSection={index}
                currentIndex={index}
                emptyForm={report.emptyForm.data || {}}
                index={index}
                renderSection={index}
                report={report.data}
                section={section}
                setActiveSection={noop}
                variant={variant}
                TableProps={{
                  Toolbar: ({
                    enterFullScreen,
                    exitFullScreen,
                    fullScreen,
                    onPrint,
                    print,
                  }: any) => {
                    return (
                      <div
                        className={cx('mb-2 flex', {
                          'flex-col': !fullScreen,
                          'flex-col-reverse md:flex-row md:items-center md:justify-between md:py-2':
                            fullScreen,
                          'px-4': fullScreen && !print,
                        })}
                      >
                        <Typography
                          className={cx({ 'mb-4 md:mb-0': fullScreen })}
                          component="h2"
                          variant="h6"
                        >
                          {section.title}
                        </Typography>
                        <div className="flex items-center justify-end">
                          {!fullScreen && (
                            <Dropdown
                              color="primary"
                              label={<IoDownloadOutline />}
                              icon
                            >
                              <Dropdown.Item onClick={onPrint}>
                                <div className="flex items-center gap-x-2">
                                  <AiFillFilePdf
                                    className="fill-red-700"
                                    size={24}
                                  />
                                  <span>PDF</span>
                                </div>
                              </Dropdown.Item>
                            </Dropdown>
                          )}
                          {section.allowFullScreen && !fullScreen && (
                            <IconButton
                              color="primary"
                              onClick={() => {
                                enterFullScreen()
                              }}
                            >
                              <IoExpand />
                            </IconButton>
                          )}
                          {fullScreen && (
                            <div>
                              <IconButton
                                className="exit-fullscreen not-printable p-2 text-primary"
                                aria-label="exit fullscreen"
                                onClick={() => {
                                  exitFullScreen()
                                }}
                              >
                                <IoClose size={32} />
                              </IconButton>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  },
                  enableCellChangeFlash: true,
                  enableFullScreen: true,
                  enablePagination: false,
                  noRowsOverlayComponentParams: { label: 'No data reported' },
                  print: true,
                  suppressCellFocus: false,
                  suppressRowHoverHighlight: false,
                  withSeparators: true,
                }}
              />
            </div>
          )
        })}
    </>
  )
}
