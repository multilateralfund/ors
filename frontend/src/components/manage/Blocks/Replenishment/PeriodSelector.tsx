'use client'

import { usePathname, useRouter } from 'next/navigation'

import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'

import styles from './periodSelector.module.css'
import { getPathPeriod } from './utils'

function PeriodSelector(props: any) {
  const { period, periodOptions } = props

  const pathname = usePathname()
  const router = useRouter()

  const basePath = getPathPeriod(pathname)
    ? pathname.split('/').slice(0, -1).join('/')
    : pathname

  const options = []
  let selectedIndex = 0

  for (let i = 0; i < periodOptions.length; i++) {
    options.push(periodOptions[i])

    if (periodOptions[i].value === period) {
      selectedIndex = i
    }
  }

  function handleChange(option: any) {
    router.push(`${basePath}/${option.value}`)
  }

  return (
    <div className={styles.selector}>
      <SimpleSelect
        initialIndex={selectedIndex}
        label="Period"
        options={options}
        onChange={handleChange}
      />
    </div>
  )
}

export default PeriodSelector
