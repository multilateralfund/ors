'use client'
import React, { useEffect, useState } from 'react'

import { IconButton, Tab, Tabs, Typography } from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { filter } from 'lodash'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers'

import { getViewSections, variants } from '.'

import { AiFillFileExcel } from '@react-icons/all-files/ai/AiFillFileExcel'
import { AiFillFilePdf } from '@react-icons/all-files/ai/AiFillFilePdf'
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
  emptyForm?: Record<string, any> | null
  print?: boolean
  report?: Record<string, any>
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [renderSection, setRenderSection] = useState(false)
  const [report]: any = useState({
    ...(props.report || {}),
    id: props.report?.cp_report?.id,
    name: props.report?.cp_report?.name,
    year: props.report?.cp_report?.year,
  })
  const [variant] = useState(
    filter(variants, (variant) => {
      const year = report.year
      return variant.minYear <= year && variant.maxYear >= year
    })[0],
  )
  const [sections] = useState(() => getViewSections(variant))

  useEffect(() => {
    setTimeout(() => {
      setRenderSection(true)
    }, 600)
  }, [currentIndex])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={currentIndex !== activeSection || !renderSection}
      />
      {report.name && (
        <HeaderTitle>
          <Typography className="mb-4 text-white" component="h1" variant="h3">
            {report.name}
          </Typography>
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
                    {!fullScreen && (
                      <Dropdown
                        color="primary"
                        label={<IoDownloadOutline />}
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
                          <div className="flex items-center gap-x-2">
                            <AiFillFilePdf className="fill-red-700" size={24} />
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
            suppressCellFocus: false,
            suppressRowHoverHighlight: false,
            withSeparators: true,
          }}
        />
      ))}
    </>
  )
}
