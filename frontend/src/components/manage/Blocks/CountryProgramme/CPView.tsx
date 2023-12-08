'use client'
import React, { useEffect, useMemo, useState } from 'react'

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
import Error from '@ors/components/theme/Views/Error'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import api, { formatApiUrl } from '@ors/helpers/Api/Api'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import { parseNumber } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import { getViewSections, variants } from '.'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import {
  IoAlbumsOutline,
  IoArrowUndoOutline,
  IoClose,
  IoDownloadOutline,
  IoExpand,
} from 'react-icons/io5'

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

export default function CPReportView(props: { archive?: boolean; id: string }) {
  const { enqueueSnackbar } = useSnackbar()
  const { archive } = props
  const { fetchBundle, report, setReport } = useStore(
    (state) => state.cp_reports,
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [renderSection, setRenderSection] = useState(false)

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
    fetchBundle(id, true, archive)
  }, [id, archive, fetchBundle])

  useEffect(() => {
    setTimeout(() => {
      setRenderSection(true)
    }, 600)
  }, [currentIndex])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={
          !report.error &&
          (report.loading || currentIndex !== activeSection || !renderSection)
        }
      />
      {!!report.error && <Error error={report.error} />}
      {!!report.data && (
        <HeaderTitle memo={report.data.status}>
          <div className="mb-4 flex min-h-[40px] items-center justify-between gap-x-4">
            <Typography className="text-white" component="h1" variant="h3">
              {report.data.name}{' '}
              <span
                className={cx({
                  'rounded bg-success px-2 py-1':
                    report.data.status === 'final',
                  'rounded bg-warning px-2 py-1':
                    report.data.status === 'draft',
                })}
              >
                {archive
                  ? `Version ${report.data.version}`
                  : capitalize(report.data.status)}
              </span>
            </Typography>
            <div className="flex items-center">
              {archive && (
                <Link
                  className="flex gap-x-2 text-white"
                  href={`/country-programme/${report.data.final_version_id}`}
                  button
                >
                  <IoArrowUndoOutline size={24} />
                  <span>Final version</span>
                </Link>
              )}
              {report.versions.loaded && !!report.versions.data?.length && (
                <Dropdown
                  className="text-white"
                  MenuProps={{
                    slotProps: {
                      paper: {
                        className: 'max-h-[200px] overflow-y-auto',
                      },
                    },
                  }}
                  label={
                    <div className="flex gap-x-2">
                      <IoAlbumsOutline size={24} />
                      {archive ? (
                        <span>Other versions</span>
                      ) : (
                        <span>Old versions</span>
                      )}
                    </div>
                  }
                >
                  {orderBy(report.versions.data, 'version', 'desc').map(
                    (report: any) => (
                      <Dropdown.Item
                        key={report.id}
                        className="flex items-center gap-x-2 text-black no-underline"
                        component={Link}
                        // @ts-ignore
                        href={`/country-programme/archive/${report.id}`}
                      >
                        Version {report.version}
                      </Dropdown.Item>
                    ),
                  )}
                </Dropdown>
              )}
            </div>
          </div>
        </HeaderTitle>
      )}
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
      {!!report.data &&
        sections.map((section, index) => (
          <TabPanel
            key={section.panelId}
            activeSection={activeSection}
            currentIndex={currentIndex}
            emptyForm={report.emptyForm.data || {}}
            index={index}
            renderSection={renderSection}
            report={report.data}
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
                              report.data?.id.toString()
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
                              report.data?.id.toString()
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
      {!archive && !!report.data && (
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
                  href={`/country-programme/edit/${report.data.id}`}
                  size="small"
                  variant="contained"
                  button
                >
                  Edit
                </Link>
                {report.data.status === 'draft' && (
                  <Button
                    color="primary"
                    size="small"
                    variant="contained"
                    onClick={async () => {
                      try {
                        const response = await api(
                          `/api/country-programme/report/${report.data?.id}/status-update/`,
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
                        setReport({
                          data: {
                            ...report.data,
                            ...response,
                          },
                        })
                        window.scrollTo({ behavior: 'smooth', top: 0 })
                      } catch (error) {
                        const errors = await error.json()
                        errors.detail &&
                          enqueueSnackbar(errors.detail, { variant: 'error' })
                      }
                    }}
                  >
                    Submit final version
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
