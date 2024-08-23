'use client'

import { usePathname, useRouter } from 'next/navigation'

import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'

import styles from './periodSelector.module.css'
import { getPathPeriod } from './utils'

function isYear(period: string) {
  return /^\d{4}$/.test(period)
}

function PeriodSelector(props: any) {
  const {
    label = 'Period',
    onChange,
    period,
    periodOptions,
    selectedPeriod,
  } = props

  const pathname = usePathname()
  const router = useRouter()

  const basePath =
    getPathPeriod(pathname) || isYear(props.period)
      ? pathname.split('/').slice(0, -1).join('/')
      : pathname

  const options = []
  let selectedIndex = 0

  for (let i = 0; i < periodOptions.length; i++) {
    options.push(periodOptions[i])

    if (
      periodOptions[i].value === period ||
      periodOptions[i].value === selectedPeriod
    ) {
      selectedIndex = i
    }
  }

  function handleChange(option: any) {
    const newPath = `${basePath}/${option.value}`
    if (onChange) {
      onChange(newPath, { basePath, option })
    } else {
      router.push(newPath)
    }
  }

  return (
    <div className={styles.selector}>
      <SimpleSelect
        initialIndex={selectedIndex}
        label={label}
        options={options}
        onChange={handleChange}
      />
    </div>
  )
}

export default PeriodSelector
