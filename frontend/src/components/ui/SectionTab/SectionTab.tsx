import { useContext } from 'react'

import Tab from '@mui/material/Tab/Tab'
import cx from 'classnames'
import { isEmpty } from 'lodash'

import { ValidationContext } from '@ors/contexts/Validation/Validation'
import { ValidationSchemaKeys } from '@ors/contexts/Validation/types'

import SectionErrorIndicator from './SectionErrorIndicator'
import { ISectionTab } from './types'

export default function SectionTab(props: ISectionTab) {
  const { errors, isActive, section, ...rest } = props
  const validation = useContext(ValidationContext)
  const sectionErrors = validation.errors[section.id as ValidationSchemaKeys]

  return (
    <Tab
      className={cx('rounded-b-none px-3 py-2', {
        'MuiTab-error': !isEmpty(errors?.[section.id]),
      })}
      aria-controls={section.panelId}
      classes={{
        selected: 'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
      }}
      label={
        <div className="relative flex items-center justify-between gap-x-2">
          <div>{section.label}</div>
          {sectionErrors?.hasErrors && (
            <SectionErrorIndicator
              className={cx({ 'text-white': isActive })}
              errors={sectionErrors.global}
            />
          )}
        </div>
      }
      {...rest}
    />
  )
}
