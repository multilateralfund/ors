'use client'
import React, { useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { filter, noop } from 'lodash'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'

import { getViewSections, variants } from '.'

import { AiFillFilePdf } from '@react-icons/all-files/ai/AiFillFilePdf'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoDownloadOutline } from '@react-icons/all-files/io5/IoDownloadOutline'
import { IoExpand } from '@react-icons/all-files/io5/IoExpand'

export default function CPReportView(props: {
  emptyForm?: Record<string, any> | null
  report?: Record<string, any>
}) {
  const [report]: any = useState({
    ...(props.report || {}),
    name: props.report?.cp_report?.name,
    year: props.report?.cp_report?.year,
  })
  const [variant] = useState(
    filter(variants, (variant) => {
      const year = report.year
      return variant.minYear <= year && variant.maxYear >= year
    })[0],
  )
  const [sections] = useState(() => (variant ? getViewSections(variant) : []))

  if (!report.name || !report.year) return null

  return (
    <>
      <HeaderTitle>
        <Typography className="mb-4 text-white" component="h1" variant="h3">
          {report.name}
        </Typography>
      </HeaderTitle>
      {sections.map((section, index) => {
        const Section = section.component

        return (
          <div key={section.panelId} className="print-section">
            <Section
              activeSection={index}
              currentIndex={index}
              emptyForm={props.emptyForm || {}}
              index={index}
              renderSection={index}
              report={report}
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
