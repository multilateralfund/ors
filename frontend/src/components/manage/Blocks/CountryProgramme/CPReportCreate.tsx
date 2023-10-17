/* eslint-disable perfectionist/sort-objects */
'use client'
import React, { useEffect, useState } from 'react'

import { Box, Button, IconButton, Tab, Tabs, Typography } from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import {
  forOwn,
  isBoolean,
  isEmpty,
  // isNil,
  // isNull,
  // isNumber,
  // isString,
  // omitBy,
} from 'lodash'
import { useSnackbar } from 'notistack'

import Field from '@ors/components/manage/Form/Field'
import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Portal from '@ors/components/manage/Utils/Portal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import api, { getResults } from '@ors/helpers/Api'
import useStore from '@ors/store'

import { getCreateSections } from '.'

import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoExpand } from '@react-icons/all-files/io5/IoExpand'

type Sections =
  | 'section_a'
  | 'section_ab'
  | 'section_b'
  | 'section_c'
  | 'section_d'
  | 'section_e'

const fields: Record<Sections, any> = {
  section_ab: {
    banned_date: { dataType: 'string', defaultValue: null },
    export_quotas: { dataType: 'number', defaultValue: null },
    exports: { dataType: 'number', defaultValue: null },
    import_quotas: { dataType: 'number', defaultValue: null },
    imports: { dataType: 'number', defaultValue: null },
    production: { dataType: 'number', defaultValue: null },
    record_usages: { dataType: 'usage', defaultValue: null },
    remarks: { dataType: 'string', defaultValue: null },
  },
  section_c: {
    previous_year_price: { dataType: 'number', defaultValue: null },
    current_year_price: { dataType: 'number', defaultValue: null },
    remarks: { dataType: 'string', defaultValue: null },
  },
  section_d: {
    all_uses: { dataType: 'number', defaultValue: null },
    destruction: { dataType: 'number', defaultValue: null },
    feedstock: { dataType: 'number', defaultValue: null },
  },
  section_a: {},
  section_b: {},
  section_e: {},
}

const mapSubstance = (substance: any, section: Sections, mandatory?: any) => {
  const substance_id = substance.id || substance.substance_id
  const newSubstance: Record<string, any> = {
    substance_id,
    isSubstance: true,
    display_name: substance.name || null,
    excluded_usages: substance.excluded_usages || [],
    group: substance.group,
    rowId: `substance_${substance_id}`,
    ...(isBoolean(mandatory) ? { mandatory } : {}),
  }
  forOwn(fields[section], (field: any, key) => {
    newSubstance[key] = substance[key] || field.defaultValue
  })
  return newSubstance
}

const mapBlend = (blend: any, section: Sections, mandatory?: any) => {
  const blend_id = blend.id || blend.blend_id
  const newBlend: Record<string, any> = {
    blend_id,
    isBlend: true,
    display_name: `${blend.name} (${blend.composition})`,
    excluded_usages: blend.excluded_usages || [],
    composition: blend.composition,
    group: blend.group,
    rowId: `blend_${blend_id}`,
    ...(isBoolean(mandatory) ? { mandatory } : {}),
  }
  forOwn(fields[section], (field: any, key) => {
    newBlend[key] = blend[key] || field.defaultValue
  })
  return newBlend
}

// const unionBy = (
//   updated: Array<any>,
//   original: Array<any>,
//   key: string,
//   section: Sections,
// ) => {
//   let fieldKey: string
//   const mergedMap = new Map()

//   original.forEach((item: any) => mergedMap.set(item[key], { ...item }))
//   updated.forEach((data: any) => {
//     if ((!data.isSubstance && !data.isBlend) || !data[key]) return
//     const originalItem = { ...mergedMap.get(data[key]) }
//     const item = data.isSubstance
//       ? mapSubstance(data, section)
//       : mapBlend(data, section)
//     const parsedItem: Record<string, any> = {}

//     for (fieldKey in fields[section]) {
//       const field = fields[section][fieldKey]
//       if (
//         isNull(item[key]) ||
//         (field.dataType === 'number' && !isNumber(item[fieldKey])) ||
//         (field.dataType === 'string' && !isString(item[fieldKey])) ||
//         (field.dataType === 'usage' &&
//           item[fieldKey].filter(
//             (usage: any) =>
//               isNumber(usage.usage_id) && isNumber(usage.quantity),
//           ))
//       ) {
//         return
//       }
//       parsedItem[key] = item[key] || field.defaultValue
//     }
//     mergedMap.set(item[key], {
//       ...originalItem,
//       ...parsedItem,
//       mandatory: originalItem.mandatory,
//     })
//   })

//   return Array.from(mergedMap.values())
// }

// const parseLocalStorageItem = (key: string) => {
//   if (__SERVER__) return null
//   const value = window.localStorage.getItem(key)
//   if (!isString(value)) return null
//   try {
//     return JSON.parse(value)
//   } catch {
//     return null
//   }
// }

// const getInitialForm = (mandatoryForm: any) => {
//   console.log('HERE getInitialForm')
//   const _section_a = parseLocalStorageItem('section_a_create') || []
//   const _section_b = parseLocalStorageItem('section_b_create') || []
//   const _section_c = parseLocalStorageItem('section_c_create') || []
//   const _section_d = parseLocalStorageItem('section_d_create') || []
//   const _section_e = parseLocalStorageItem('section_e_create') || []
//   const _section_f = parseLocalStorageItem('section_f_create') || []

//   const { section_a, section_b, section_c, section_d, section_e, section_f } =
//     mandatoryForm

//   return {
//     ...mandatoryForm,
//     section_a: unionBy(_section_a, section_a, 'rowId', 'section_ab'),
//     section_b: unionBy(_section_b, section_b, 'rowId', 'section_ab'),
//     section_c: unionBy(_section_c, section_c, 'rowId', 'section_c'),
//     section_d: unionBy(_section_d, section_d, 'rowId', 'section_d'),
//     section_e: unionBy(_section_e, section_e, 'rowId', 'section_e'),
//     section_f: {
//       remarks: _section_f.remarks || section_f.remarks,
//     },
//   }
// }

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
            opacity: activeSection === currentIndex ? 1 : 0,
          }}
          transition={{ duration: 0.5 }}
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

export default function CPReportCreate(props: {
  blends?: Array<any>
  emptyForm?: Record<string, any> | null
  substances_a?: Array<any>
  substances_b?: Array<any>
  substances_c?: Array<any>
}) {
  const { blends, substances_a, substances_b, substances_c } = props
  const { enqueueSnackbar } = useSnackbar()
  const countries = useStore((state) => [
    { id: 0, label: 'Any' },
    ...getResults(state.common.countries.data).results.map((country) => ({
      id: country.id,
      label: country.name,
    })),
  ])
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [renderSection, setRenderSection] = useState(false)
  const [mandatoryForm] = useState<any>({
    country: null,
    name: '',
    section_a: substances_a?.map((substance) =>
      mapSubstance(substance, 'section_ab', true),
    ),
    section_b: [
      ...(substances_b?.map((substance) =>
        mapSubstance(substance, 'section_ab', true),
      ) || []),
      ...(blends?.map((blend) => mapBlend(blend, 'section_ab', true)) || []),
    ],
    section_c: [
      ...(substances_c?.map((substance) =>
        mapSubstance(substance, 'section_c', true),
      ) || []),
      ...(blends?.map((blend) => mapBlend(blend, 'section_c', true)) || []),
    ],
    section_d: [
      {
        display_name: 'HFC-23',
        id: 'hfc_23',
      },
    ].map((substance) => mapSubstance(substance, 'section_d', true)),
    section_e: [],
    section_f: {
      remarks: '',
    },
    year: new Date().getFullYear(),
  })
  // const [form, setForm] = useState(getInitialForm(mandatoryForm))
  const [form, setForm] = useState(mandatoryForm)

  const [sections] = useState(getCreateSections())

  useEffect(() => {
    setTimeout(() => {
      setRenderSection(true)
    }, 600)
  }, [currentIndex])

  // useEffect(() => {
  //   const section_a = form?.section_a?.map((substance: any) =>
  //     omitBy(substance, isNil),
  //   )
  //   window.localStorage.setItem('section_a_create', JSON.stringify(section_a))
  // }, [form.section_a])

  // useEffect(() => {
  //   const section_b = form?.section_b?.map((chimical: any) => {
  //     return omitBy(chimical, isNil)
  //   })
  //   window.localStorage.setItem('section_b_create', JSON.stringify(section_b))
  // }, [form.section_b])

  // useEffect(() => {
  //   const section_c = form?.section_c?.map((chimical: any) => {
  //     return omitBy(chimical, isNil)
  //   })
  //   window.localStorage.setItem('section_c_create', JSON.stringify(section_c))
  // }, [form.section_c])

  // useEffect(() => {
  //   const section_d = form?.section_d?.map((chimical: any) => {
  //     return omitBy(chimical, isNil)
  //   })
  //   window.localStorage.setItem('section_d_create', JSON.stringify(section_d))
  // }, [form.section_d])

  // useEffect(() => {
  //   const section_e = form?.section_e?.map((factory: any) => {
  //     return omitBy(factory, isNil)
  //   })
  //   window.localStorage.setItem('section_e_create', JSON.stringify(section_e))
  // }, [form.section_e])

  // useEffect(() => {
  //   const section_f = form?.section_f
  //   window.localStorage.setItem('section_f_create', JSON.stringify(section_f))
  // }, [form.section_f])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={currentIndex !== activeSection || !renderSection}
      />
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          New submission
        </Typography>
      </HeaderTitle>
      <form className="create-submission-form">
        <div className="grid grid-cols-3 gap-x-4">
          <Field
            id="name"
            name="name"
            error={!!errors.name}
            helperText={errors.name}
            label="Report name"
          />
          <Field
            id="country"
            name="country_id"
            options={countries}
            value={form.country}
            widget="autocomplete"
            Input={{
              error: !!errors.country_id,
              helperText: errors.country_id,
              label: 'Country',
            }}
            onChange={(_: any, country: any) => {
              setForm({ ...form, country })
            }}
          />
        </div>
        <Tabs
          className="scrollable mb-2"
          aria-label="create submission sections"
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
              className={cx({ 'MuiTab-error': !isEmpty(errors?.[section.id]) })}
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
            errors={errors}
            form={form}
            index={index}
            mandatoryForm={mandatoryForm}
            mapBlend={mapBlend}
            mapSubstance={mapSubstance}
            renderSection={renderSection}
            section={section}
            setActiveSection={setActiveSection}
            setForm={setForm}
            TableProps={{
              Toolbar: ({
                enterFullScreen,
                exitFullScreen,
                fullScreen,
              }: any) => {
                return (
                  <div
                    className={cx(
                      'flex items-center justify-between gap-x-4 py-2',
                      {
                        'px-4': fullScreen,
                      },
                    )}
                  >
                    <Typography component="h2" variant="h6">
                      {section.title}
                    </Typography>
                    {section.allowFullScreen && !fullScreen && (
                      <div>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            enterFullScreen()
                          }}
                        >
                          <IoExpand />
                        </IconButton>
                      </div>
                    )}
                    {fullScreen && (
                      <div>
                        <IconButton
                          className="exit-fullscreen p-2 text-primary"
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
                )
              },
              enableCellChangeFlash: true,
              enableFullScreen: true,
              enablePagination: false,
              fadeInOut: false,
              getRowId: (props: any) => {
                return props.data.rowId
              },
              noRowsOverlayComponentParams: { label: 'No data reported' },
              suppressCellFocus: false,
              suppressRowHoverHighlight: false,
              withSeparators: true,
            }}
            {...props}
          />
        ))}

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
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={async () => {
                  try {
                    await api('api/country-programme/reports/', {
                      data: { ...form, country_id: form.country?.id },
                      method: 'POST',
                    })
                    setErrors({})
                    localStorage.removeItem('section_a_create')
                    localStorage.removeItem('section_b_create')
                    localStorage.removeItem('section_c_create')
                    localStorage.removeItem('section_d_create')
                    localStorage.removeItem('section_e_create')
                    localStorage.removeItem('section_f_create')
                  } catch (error) {
                    if (error.status === 400) {
                      setErrors({ ...(await error.json()) })
                      enqueueSnackbar(
                        <>Please make sure all the inputs are correct.</>,
                        { variant: 'error' },
                      )
                    } else {
                      setErrors({})
                    }
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </Box>
        </Portal>
      </form>
    </>
  )
}
