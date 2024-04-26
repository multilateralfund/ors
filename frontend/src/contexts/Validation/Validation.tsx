import type {
  IRow,
  IRowValidationResult,
  UsageMapping,
  ValidateSectionResult,
  ValidateSectionResultValue,
  ValidationSchemaKeys,
} from './types'
import { ApiUsage } from '@ors/types/api_usages'

import { createContext, useState } from 'react'

import Drawer from '@mui/material/Drawer/Drawer'
import cx from 'classnames'

import { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'
import useApi from '@ors/hooks/useApi'

import validationSchema from './validationSchema'

import { IoCloseCircle, IoRadioButtonOn } from 'react-icons/io5'

function usageMapping(usages: ApiUsage[]): UsageMapping {
  return usages.reduce((acc, usage) => {
    acc[usage.full_name] = usage
    return acc
  }, {} as UsageMapping)
}

function validateSectionRows(
  rows: IRow[],
  section_id: ValidationSchemaKeys,
  usages: UsageMapping,
) {
  return rows
    .flatMap((row) =>
      validationSchema[section_id]?.rows?.map((rowValidator) => {
        const { highlight_cells, validator, ...validatorProps } = rowValidator
        const isValid = validator(row, usages)
        if (!isValid) {
          return {
            ...validatorProps,
            highlight_cells: Object.keys(highlight_cells).filter((key) =>
              highlight_cells[key](row),
            ),
            row_id: row.row_id,
          }
        }
      }),
    )
    .filter((val) => val != undefined) as IRowValidationResult[]
}

function validateSection(
  form: CPBaseForm,
  section_id: ValidationSchemaKeys,
  usages: UsageMapping,
): ValidateSectionResult {
  const rowErrors = validateSectionRows(
    form[section_id] as IRow[],
    section_id,
    usages,
  ).reduce(
    (acc: Record<string, Omit<IRowValidationResult, 'row_id'>[]>, val) => {
      const { row_id, ...rest } = val
      if (!acc[row_id]) {
        acc[row_id] = []
      }
      acc[row_id].push(rest)
      return acc
    },
    {},
  )
  const hasRowErrors = !!Object.keys(rowErrors).length
  const globalErrors = hasRowErrors
    ? [
        {
          id: 'section-validation',
          message: 'This section contains incomplete or invalid data.',
        },
      ]
    : []
  return {
    global: globalErrors,
    hasErrors: hasRowErrors || !!globalErrors.length,
    rows: rowErrors,
  }
}

function applyValidationSchema(form: CPBaseForm, usageApiData: ApiUsage[]) {
  const validationSchemaKeys = Object.keys(
    validationSchema,
  ) as ValidationSchemaKeys[]

  return validationSchemaKeys.reduce(
    (acc, section_id) => {
      acc[section_id] = validateSection(
        form,
        section_id,
        usageMapping(usageApiData),
      )
      return acc
    },
    {} as Record<ValidationSchemaKeys, ValidateSectionResult>,
  )
}

export interface ValidationContextProps {
  errors: Record<ValidationSchemaKeys, ValidateSectionResult>
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>
}

export const ValidationContext = createContext(
  null as unknown as ValidationContextProps,
)

export const ValidationProvider = (props: {
  children: React.ReactNode
  form: CPBaseForm
}) => {
  const { children, form } = props

  const [openDrawer, setOpenDrawer] = useState(false)

  const usagesApi = useApi<ApiUsage[]>({
    options: {},
    path: '/api/usages/',
  })

  const errors =
    usagesApi.loaded && usagesApi.data
      ? applyValidationSchema(form, usagesApi.data)
      : ({} as Record<ValidationSchemaKeys, ValidateSectionResult>)

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpenDrawer(newOpen)
  }
  return (
    <ValidationContext.Provider
      value={{
        errors: errors,
        setOpenDrawer,
      }}
    >
      <Drawer
        className={cx('radius-none')}
        anchor="left"
        open={openDrawer}
        onClose={toggleDrawer(false)}
      >
        <div className="p-4" style={{ width: '32rem' }}>
          <div className="flex justify-end">
            <IoCloseCircle
              className="cursor-pointer hover:text-primary"
              size={32}
              onClick={toggleDrawer(false)}
            />
          </div>
          <div>
            {(Object.keys(errors) as ValidationSchemaKeys[]).map(
              (section_id) => {
                const hasErrors = errors[section_id].hasErrors
                const rowErrors = Object.values(
                  errors[section_id].rows,
                ).flatMap((val) => val) as ValidateSectionResultValue[]
                if (hasErrors) {
                  return (
                    <div key={section_id}>
                      <h4 className="uppercase">
                        {section_id.replace('_', ' ')}
                      </h4>
                      <div className="w-32 text-xl text-red-950">
                        {rowErrors.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-x-2 px-4 py-2 hover:bg-primary hover:text-white"
                          >
                            <IoRadioButtonOn />
                            <div>{item.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                } else {
                  return null
                }
              },
            )}
          </div>
        </div>
      </Drawer>
      {children}
    </ValidationContext.Provider>
  )
}
