'use client'
import React, { useEffect, useMemo, useState } from 'react'

import { Box, Button, Tab, Tabs, Typography } from '@mui/material'
import { isBoolean, isNil, isString, omitBy } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import Portal from '@ors/components/manage/Utils/Portal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import api from '@ors/helpers/Api'

import { getCreateSections } from '.'

const mapChimicalSubstance = (data: any, mandatory: any) => ({
  banned_date: data.banned_date || null,
  display_name: data.name || null,
  excluded_usages: data.excluded_usages || [],
  export_quotas: data.export_quotas || null,
  exports: data.exports || null,
  group: data.group,
  import_quotas: data.import_quotas || null,
  imports: data.imports || null,
  name: data.name || null,
  production: data.production || null,
  record_usages: data.record_usages || [],
  remarks: data.remarks || null,
  sort_order: data.sort_order,
  ...(isBoolean(mandatory) ? { mandatory } : {}),
})

const mapSubstance = (substance: any, mandatory?: any) => {
  const substance_id = substance.id || substance.substance_id
  return {
    ...mapChimicalSubstance(substance, mandatory),
    isSubstance: true,
    rowId: `substance_${substance_id}`,
    substance_id,
  }
}

const mapBlend = (blend: any, mandatory?: any) => {
  const blend_id = blend.id || blend.blend_id
  return {
    ...mapChimicalSubstance(blend, mandatory),
    blend_id,
    composition: blend.composition,
    display_name: `${blend.name} (${blend.composition})`,
    isBlend: true,
    rowId: `blend_${blend_id}`,
  }
}

const unionBy = (updated: Array<any>, original: Array<any>, key: string) => {
  const mergedMap = new Map()

  original.forEach((item: any) => mergedMap.set(item[key], { ...item }))
  updated.forEach((item: any) => {
    const originalItem = { ...mergedMap.get(item[key]) }
    mergedMap.set(item[key], {
      ...originalItem,
      ...item,
      mandatory: originalItem.mandatory,
    })
  })

  return Array.from(mergedMap.values())
}

const parseLocalStorageItem = (key: string) => {
  if (__SERVER__) return null
  const value = window.localStorage.getItem(key)
  if (!isString(value)) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const getInitialForm = (mandatoryForm: any) => {
  const section_a = parseLocalStorageItem('section_a_create') || []
  const section_b = parseLocalStorageItem('section_b_create') || []
  const section_c = parseLocalStorageItem('section_c_create') || []
  const section_d = parseLocalStorageItem('section_d_create') || []
  const section_e = parseLocalStorageItem('section_e_create') || []
  const section_f = parseLocalStorageItem('section_f_create') || []

  return {
    ...mandatoryForm,
    section_a: unionBy(section_a, mandatoryForm.section_a, 'rowId'),
    section_b: unionBy(section_b, mandatoryForm.section_b, 'rowId'),
    section_c: unionBy(section_c, mandatoryForm.section_c, 'rowId'),
    section_d: unionBy(section_d, mandatoryForm.section_d, 'rowId'),
    section_e: unionBy(section_e, mandatoryForm.section_e, 'rowId'),
    section_f: {
      remarks: section_f.remarks || mandatoryForm.section_f.remarks,
    },
  }
}

export default function CPReportCreate(props: {
  blends?: Array<any>
  emptyForm?: Record<string, any> | null
  substances_a?: Array<any>
  substances_b?: Array<any>
  substances_c?: Array<any>
}) {
  const { blends, substances_a, substances_b, substances_c } = props
  const [activeSection, setActiveSection] = useState(0)
  const [fullScreen, setFullScreen] = useState(false)
  const [mandatoryForm] = useState({
    country: '',
    name: '',
    section_a: substances_a?.map((substance) => mapSubstance(substance, true)),
    section_b: [
      ...(substances_b?.map((substance) => mapSubstance(substance, true)) ||
        []),
      ...(blends?.map((blend) => mapBlend(blend, true)) || []),
    ],
    section_c: [
      ...(substances_c?.map((substance) => mapSubstance(substance, true)) ||
        []),
      ...(blends?.map((blend) => mapBlend(blend, true)) || []),
    ],
    section_d: [
      {
        all_uses: 0,
        destruction: 0,
        display_name: 'HFC-23',
        feedstock: 0,
        mandatory: true,
        rowId: 'substance_hfc_23',
      },
    ],
    section_e: [],
    section_f: {
      remarks: '',
    },
    year: new Date().getFullYear(),
  })
  const [form, setForm] = useState(getInitialForm(mandatoryForm))

  const [sections] = useState(getCreateSections())

  const section = useMemo(
    () => sections[activeSection],
    [activeSection, sections],
  )

  useEffect(() => {
    const section_a = form?.section_a?.map((substance: any) =>
      omitBy(substance, isNil),
    )
    window.localStorage.setItem('section_a_create', JSON.stringify(section_a))
  }, [form.section_a])

  useEffect(() => {
    const section_b = form?.section_b?.map((chimical: any) => {
      return omitBy(chimical, isNil)
    })
    window.localStorage.setItem('section_b_create', JSON.stringify(section_b))
  }, [form.section_b])

  useEffect(() => {
    const section_c = form?.section_c?.map((chimical: any) => {
      return omitBy(chimical, isNil)
    })
    window.localStorage.setItem('section_c_create', JSON.stringify(section_c))
  }, [form.section_c])

  useEffect(() => {
    const section_d = form?.section_d?.map((chimical: any) => {
      return omitBy(chimical, isNil)
    })
    window.localStorage.setItem('section_d_create', JSON.stringify(section_d))
  }, [form.section_d])

  useEffect(() => {
    const section_e = form?.section_e?.map((factory: any) => {
      return omitBy(factory, isNil)
    })
    window.localStorage.setItem('section_e_create', JSON.stringify(section_e))
  }, [form.section_e])

  useEffect(() => {
    const section_f = form?.section_f
    window.localStorage.setItem('section_f_create', JSON.stringify(section_f))
  }, [form.section_f])

  const Section: React.FC<any> = section.component

  return (
    <>
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          New submission
        </Typography>
      </HeaderTitle>
      <form className="create-submission-form">
        <div className="grid grid-cols-3 gap-x-4">
          <Field id="name" name="name" label="Report name" />
          <Field id="country" name="country_id" label="Country" />
        </div>
        <Tabs
          className="country-programme-tabs mb-4"
          aria-label="create submission sections"
          value={activeSection}
          onChange={(event: React.SyntheticEvent, newSection: number) => {
            setActiveSection(newSection)
            setFullScreen(false)
          }}
        >
          {sections.map((section) => (
            <Tab
              key={section.id}
              aria-controls={section.panelId}
              label={section.label}
            />
          ))}
        </Tabs>
        {section.allowFullScreen && (
          <div className="mb-4 text-right">
            <Button variant="outlined" onClick={() => setFullScreen(true)}>
              Full screen
            </Button>
          </div>
        )}
        <div id={section.panelId} aria-labelledby={section.id} role="tabpanel">
          <Section
            exitFullScreen={() => setFullScreen(false)}
            form={form}
            fullScreen={fullScreen}
            mandatoryForm={mandatoryForm}
            mapBlend={mapBlend}
            mapSubstance={mapSubstance}
            setForm={setForm}
            {...props}
          />
        </div>
        <Portal domNode="bottom-control">
          <Box className="rounded-none border-0 border-t px-4">
            <div className="container flex w-full justify-between">
              <Button color="secondary" size="small" variant="contained">
                Close
              </Button>
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={async () => {
                  localStorage.removeItem('section_a_create')
                  localStorage.removeItem('section_b_create')
                  localStorage.removeItem('section_c_create')
                  localStorage.removeItem('section_d_create')
                  localStorage.removeItem('section_e_create')
                  localStorage.removeItem('section_f_create')
                  await api('api/country-programme/reports/', {
                    data: form,
                    method: 'POST',
                  })
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
