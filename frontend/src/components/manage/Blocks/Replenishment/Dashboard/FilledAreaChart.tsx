import React, { useMemo, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'

import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'

import {
  COMMON_OPTIONS,
  backgroundColorPlugin,
  downloadChartAsImage,
} from '@ors/components/manage/Blocks/Replenishment/Dashboard/chartUtils'

import { IDashboardDataApiResponse } from './useGetDashboardDataTypes'

import { IoDownloadOutline } from 'react-icons/io5'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
)

const FilledAreaChart = ({
  data,
  title,
}: {
  data: IDashboardDataApiResponse['charts']
  title: string
}) => {
  const chartRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const { pledged_contributions } = data

  const chartData = useMemo(() => {
    return {
      datasets: [
        {
          backgroundColor: 'rgba(0, 149, 213, 0.2)',
          borderColor: '#002A3C',
          borderWidth: 2,
          data: pledged_contributions.map((item) => item.agreed_pledges),
          fill: 'origin',
          label: 'Pledged Contributions',
        },
      ],
      labels: pledged_contributions.map(
        (item) => `${item.start_year}-${item.end_year}`,
      ),
    }
  }, [pledged_contributions])

  const options = {
    interaction: {
      intersect: false,
      mode: 'nearest', // Trigger tooltip when mouse is closest to a point
    },
    plugins: { customCanvasBackgroundColor: true, legend: { display: false } },
    ...COMMON_OPTIONS(),
  }

  return (
    <div
      className="relative h-96 w-full print:break-inside-avoid"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      <Line
        data={chartData}
        options={options as ChartOptions<'line'>}
        plugins={[backgroundColorPlugin]}
        ref={chartRef}
      />
      {showToolbar && (
        <button
          className="absolute -top-2 right-2 flex cursor-pointer items-center border-none bg-transparent text-primary no-underline"
          onClick={() => downloadChartAsImage(chartRef, title)}
        >
          <IoDownloadOutline size={18} />
        </button>
      )}
    </div>
  )
}

export default FilledAreaChart
