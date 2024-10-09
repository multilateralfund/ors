'use client'

import useGetDashboardData from '@ors/components/manage/Blocks/Replenishment/Dashboard/useGetDashboardData'

import SectionDashboard from './SectionDashboard'

interface IDashboardViewProps {
  period?: string
  section?: string
}

function DashboardView(props: IDashboardViewProps) {
  const { period, section } = props
  const { newData } = useGetDashboardData()
  const { charts } = newData

  return <SectionDashboard charts={charts} period={period} tab={section} />
}

export default DashboardView
