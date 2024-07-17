import React, { useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import resolveConfig from 'tailwindcss/resolveConfig'

import {
  COMMON_OPTIONS,
  MOCK_LABELS,
  backgroundColorPlugin,
  downloadChartAsImage,
} from '@ors/components/manage/Blocks/Replenishment/Dashboard/chartUtils'
import { useStore } from '@ors/store'
import tailwindConfigModule from '~/tailwind.config'

import { IoDownloadOutline } from 'react-icons/io5'

const tailwindConfig = resolveConfig(tailwindConfigModule)

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

const AreaChart = () => {
  const { mode } = useStore((state) => state.theme)
  const primaryColor = tailwindConfig.originalColors[mode].primary.DEFAULT
  const chartRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)

  // Ensure data is consistent and does not change on hover
  // const dataRef = useRef({
  //   datasets: [
  //     {
  //       backgroundColor: 'rgba(255, 255, 0, 0.2)',
  //       borderColor: primaryColor,
  //       borderWidth: 2,
  //       data: Array.from({ length: 11 }, () =>
  //         Math.floor(Math.random() * 30000000),
  //       ),
  //       fill: 'origin',
  //       label: 'Random Data',
  //       pointRadius: 1,
  //     },
  //   ],
  //   labels: MOCK_LABELS,
  // })
  const dataRef = useRef({
    datasets: [
      {
        backgroundColor: 'rgba(0, 0, 255, 0.2)', // Blue color for the second dataset
        borderColor: primaryColor,
        borderWidth: 2,
        data: Array.from({ length: 11 }, () =>
          Math.floor(Math.random() * 30000000),
        ),
        fill: 'origin',
        label: 'Area 1',
        pointRadius: 1,
      },
      {
        backgroundColor: 'rgba(255, 255, 0, 0.2)', // Yellow color for the first dataset
        borderColor: primaryColor,
        borderWidth: 2,
        data: Array.from({ length: 11 }, () =>
          Math.floor(Math.random() * 30000000),
        ),
        fill: 'origin',
        label: 'Area 2',
        pointRadius: 1,
      },
    ],
    labels: MOCK_LABELS,
  })

  const options = {
    interaction: {
      intersect: false,
      // mode: 'nearest', // Trigger tooltip when mouse is closest to a point
      mode: 'index', // Show tooltip for all datasets at the same index
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          padding: 10,
        },
      },
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        ticks: {
          callback: function (value) {
            return value.toLocaleString() // Format y-axis tick labels with commas
          },
          padding: 10,
        },
      },
    },
    tension: 0.2, // Adjust line curve
    ...COMMON_OPTIONS,
  }

  return (
    <div className="relative">
      <div
        className="relative"
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
      >
        <Line
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

export default AreaChart
