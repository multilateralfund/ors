/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
'use client'
import React, { useEffect, useState } from 'react'

import {
  Box,
  Button,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { capitalize, filter, orderBy } from 'lodash'
import { useSnackbar } from 'notistack'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Portal from '@ors/components/manage/Utils/Portal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers'
import api from '@ors/helpers/Api'

import { getViewSections, variants } from '.'

import { AiFillFileExcel } from '@react-icons/all-files/ai/AiFillFileExcel'
import { AiFillFilePdf } from '@react-icons/all-files/ai/AiFillFilePdf'
import { IoAlbumsOutline } from '@react-icons/all-files/io5/IoAlbumsOutline'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoDownloadOutline } from '@react-icons/all-files/io5/IoDownloadOutline'
import { IoExpand } from '@react-icons/all-files/io5/IoExpand'

function TabPanel(props: any) {
  const {
    activeSection,
    currentIndex,
    index,
    renderSection,
    section,
    setActiveSection,
    ...rest
  } = props
  const Section: React.FC<any> = section.component

  return (
    <div
      id={section.panelId}
      key={section.panelId}
      aria-labelledby={section.id}
      hidden={activeSection !== index}
      role="tabpanel"
    >
      <AnimatePresence>
        <FadeInOut
          animate={{
            opacity: activeSection === currentIndex && renderSection ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {((currentIndex === index && renderSection) ||
            (activeSection !== currentIndex && activeSection === index)) && (
            <Section
              index={index}
              section={section}
              setActiveSection={setActiveSection}
              {...rest}
            />
          )}
        </FadeInOut>
      </AnimatePresence>
    </div>
  )
}

export default function CPReportView(props: {
  archive?: boolean
  emptyForm?: Record<string, any> | null
  print?: boolean
  report: Record<string, any>
  versions?: any
}) {
  const { enqueueSnackbar } = useSnackbar()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [renderSection, setRenderSection] = useState(false)
  const [report, setReport]: any = useState({
    ...(props.report || {}),
    ...(props.report?.cp_report || {}),
  })
  const [versions, setVersions]: any = useState(props.versions)
  const [variant] = useState(
    filter(variants, (variant) => {
      const year = report.year
      return variant.minYear <= year && variant.maxYear >= year
    })[0],
  )
  const [sections] = useState(() => (variant ? getViewSections(variant) : []))

  useEffect(() => {
    setTimeout(() => {
      setRenderSection(true)
    }, 600)
  }, [currentIndex])

  if (!report.name || !report.year) return null

  console.log('HERE', report)

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={currentIndex !== activeSection || !renderSection}
      />
      <HeaderTitle memo={report.status}>
        <div className="mb-4 flex min-h-[40px] items-center justify-between gap-x-4">
          <Typography className="text-white" component="h1" variant="h3">
            {report.name}{' '}
            <span
              className={cx({
                'rounded bg-success px-2 py-1': report.status === 'final',
                'rounded bg-warning px-2 py-1': report.status === 'draft',
              })}
            >
              {props.archive
                ? `Version ${report.version}`
                : capitalize(report.status)}
            </span>
          </Typography>
          {!!versions?.length && (
            <Dropdown
              className="text-white"
              label={<IoAlbumsOutline />}
              tooltip="Change version"
              MenuProps={{
                slotProps: {
                  paper: {
                    className: 'max-h-[200px] overflow-y-auto',
                  },
                },
              }}
              icon
            >
              {orderBy(versions, 'version', 'desc').map((report: any) => (
                <Dropdown.Item
                  key={report.id}
                  className="flex items-center gap-x-2 text-black no-underline"
                  component={Link}
                  // @ts-ignore
                  href={`/country-programme/archive/${report.id}`}
                >
                  Version {report.version}
                </Dropdown.Item>
              ))}
            </Dropdown>
          )}
        </div>
      </HeaderTitle>
      <Tabs
        className="scrollable mb-4"
        aria-label="view submission sections"
        scrollButtons="auto"
        value={currentIndex}
        variant="scrollable"
        onChange={(event: React.SyntheticEvent, index: number) => {
          setCurrentIndex(index)
          setRenderSection(false)
        }}
        allowScrollButtonsMobile
      >
        {sections.map((section) => (
          <Tab
            key={section.id}
            aria-controls={section.panelId}
            label={section.label}
          />
        ))}
      </Tabs>
      {sections.map((section, index) => (
        <TabPanel
          key={section.panelId}
          activeSection={activeSection}
          currentIndex={currentIndex}
          emptyForm={props.emptyForm || {}}
          index={index}
          renderSection={renderSection}
          report={report}
          section={section}
          setActiveSection={setActiveSection}
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
                    <Dropdown
                      color="primary"
                      label={<IoDownloadOutline />}
                      tooltip="Download"
                      icon
                    >
                      <Dropdown.Item>
                        <Link
                          className="flex items-center gap-x-2 text-black no-underline"
                          target="_blank"
                          href={
                            formatApiUrl('api/country-programme/export/') +
                            '?cp_report_id=' +
                            report.id?.toString()
                          }
                          download
                        >
                          <AiFillFileExcel
                            className="fill-green-700"
                            size={24}
                          />
                          <span>XLSX</span>
                        </Link>
                      </Dropdown.Item>
                      <Dropdown.Item onClick={onPrint}>
                        <Link
                          className="flex items-center gap-x-2 text-black no-underline"
                          target="_blank"
                          href={
                            formatApiUrl('api/country-programme/print/') +
                            '?cp_report_id=' +
                            report.id?.toString()
                          }
                          download
                        >
                          <AiFillFilePdf className="fill-red-700" size={24} />
                          <span>PDF</span>
                        </Link>
                      </Dropdown.Item>
                    </Dropdown>
                    {section.allowFullScreen && !fullScreen && (
                      <Tooltip placement="top" title="Enter fullscreen">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            enterFullScreen()
                          }}
                        >
                          <IoExpand />
                        </IconButton>
                      </Tooltip>
                    )}
                    {fullScreen && (
                      <Tooltip placement="top" title="Exit fullscreen">
                        <IconButton
                          className="exit-fullscreen not-printable p-2 text-primary"
                          aria-label="exit fullscreen"
                          onClick={() => {
                            exitFullScreen()
                          }}
                        >
                          <IoClose size={24} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )
            },
            enableCellChangeFlash: true,
            enableFullScreen: true,
            enablePagination: false,
            noRowsOverlayComponentParams: { label: 'No data reported' },
            suppressCellFocus: false,
            suppressRowHoverHighlight: false,
            withSeparators: true,
          }}
        />
      ))}
      {!props.archive && (
        <Portal domNode="bottom-control">
          <Box className="rounded-none border-0 border-t px-4">
            <div className="container flex w-full justify-between">
              <Link
                color="secondary"
                href="/country-programme"
                size="small"
                variant="contained"
                button
              >
                Close
              </Link>
              <div className="flex gap-x-4">
                <Link
                  color="primary"
                  href={`/country-programme/edit/${report.id}`}
                  size="small"
                  variant="contained"
                  button
                >
                  Edit
                </Link>
                {report.status === 'draft' && (
                  <Button
                    color="primary"
                    size="small"
                    variant="contained"
                    onClick={async () => {
                      try {
                        const response = await api(
                          `/api/country-programme/report/${props.report.cp_report.id}/status-update/`,
                          {
                            data: {
                              status: 'final',
                            },
                            method: 'PUT',
                          },
                        )
                        enqueueSnackbar(
                          <>
                            Submit submission for {response.country}{' '}
                            {response.year}.
                          </>,
                          { variant: 'success' },
                        )
                        window.scrollTo({ behavior: 'smooth', top: 0 })
                        setReport({ ...report, ...response })
                      } catch (error) {
                        const errors = await error.json()
                        errors.detail &&
                          enqueueSnackbar(errors.detail, { variant: 'error' })
                      }
                    }}
                  >
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </Box>
        </Portal>
      )}
    </>
  )
}
