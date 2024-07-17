import React, { useRef, useState } from 'react'
import { Bar } from 'react-chartjs-2'

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import resolveConfig from 'tailwindcss/resolveConfig'

import {
  COMMON_OPTIONS,
  backgroundColorPlugin,
  downloadChartAsImage,
} from '@ors/components/manage/Blocks/Replenishment/Dashboard/chartUtils'
import { useStore } from '@ors/store'
import tailwindConfigModule from '~/tailwind.config'

import { IoDownloadOutline } from 'react-icons/io5'

const tailwindConfig = resolveConfig(tailwindConfigModule)

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const BarChart = ({ data }) => {
  const { mode } = useStore((state) => state.theme)
  const primaryColor = tailwindConfig.originalColors[mode].primary.DEFAULT
  const chartRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)

  // Prepare the data for the chart
  const chartData = {
    datasets: [
      {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
        borderWidth: 1,
        data: data.map((item) => item.outstanding_pledges),
        label: 'Outstanding Pledges',
      },
    ],
    labels: data.map(
      (item) => `${item.start_year}-${item.end_year}`,
    ),
  }

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value.toLocaleString()
          },
        },
      },
    },
    ...COMMON_OPTIONS,
  }

  return (
    <div className="relative">
      <div
        className="relative"
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
      >
        <Bar
          data={chartData}
          options={options}
          plugins={[backgroundColorPlugin]}
          ref={chartRef}
        />
        {showToolbar && (
          <button
            className="absolute right-2 top-2 flex cursor-pointer items-center border-none bg-transparent text-primary no-underline"
            onClick={() => downloadChartAsImage(chartRef)}
          >
            <IoDownloadOutline size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

export default BarChart
