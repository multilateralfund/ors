'use client'

import { usePathname, useRouter } from 'next/navigation'

import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'

import { PERIODS } from './constants'
import styles from './periodSelector.module.css'

function PeriodSelector(props: any) {
  const { period } = props

  const pathname = usePathname()
  const router = useRouter()

  const basePath = pathname.split('/').slice(0, -1).join('/')

  const options = []
  let selectedIndex = 0

  for (let i = 0; i < PERIODS.length; i++) {
    options.push({ label: PERIODS[i] })
    if (PERIODS[i] === period) {
      selectedIndex = i
    }
  }

  function handleChange(option: any) {
    router.push(`${basePath}/${option.label}`)
  }

  return (
    <div className={styles.selector}>
      <SimpleSelect initialIndex={selectedIndex} label="Period" options={options} onChange={handleChange} />
    </div>
  )
}

export default PeriodSelector
