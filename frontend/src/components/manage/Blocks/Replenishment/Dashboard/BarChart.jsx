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

import { useStore } from '@ors/store'
import tailwindConfigModule from '~/tailwind.config'

import { IoDownloadOutline } from 'react-icons/io5'
import {
  backgroundColorPlugin,
  COMMON_OPTIONS,
  downloadChartAsImage,
  MOCK_LABELS,
} from '@ors/components/manage/Blocks/Replenishment/Dashboard/chartUtils'

const tailwindConfig = resolveConfig(tailwindConfigModule)

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const BarChart = () => {
  const { mode } = useStore((state) => state.theme)
  const primaryColor = tailwindConfig.originalColors[mode].primary.DEFAULT
  const chartRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)

  // Ensure data is consistent and does not change on hover
  const dataRef = useRef({
    datasets: [
      {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
        borderWidth: 1,
        data: Array.from({ length: 11 }, () =>
          Math.floor(Math.random() * 30000000),
        ),
        label: 'Random Data',
      },
    ],
    labels: MOCK_LABELS,
  })

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
          data={dataRef.current}
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
