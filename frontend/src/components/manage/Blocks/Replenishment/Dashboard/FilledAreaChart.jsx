import React, { useMemo, useRef, useState } from 'react'
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

const FilledAreaChart = ({ data, title }) => {
  const { mode } = useStore((state) => state.theme)
  const primaryColor = tailwindConfig.originalColors[mode].primary.DEFAULT
  const chartRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)

  const chartData = useMemo(() => {
    return {
      datasets: [
        {
          backgroundColor: 'rgba(0, 0, 255, 0.2)', // Blue color
          borderColor: primaryColor,
          borderWidth: 2,
          data: data.map((item) => item.agreed_pledges),
          fill: 'origin',
          label: 'Pledged Contributions',
        },
      ],
      labels: data.map((item) => `${item.start_year}-${item.end_year}`),
    }
  }, [data, primaryColor])

  const options = {
    interaction: {
      intersect: false,
      mode: 'nearest', // Trigger tooltip when mouse is closest to a point
    },
    plugins: { customCanvasBackgroundColor: true, legend: { display: false } },
    ...COMMON_OPTIONS(primaryColor),
  }

  return (
    <div
      className="relative h-96 w-full print:break-inside-avoid"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      <Line
        data={chartData}
        options={options}
        plugins={[backgroundColorPlugin]}
        ref={chartRef}
      />
      {showToolbar && (
        <button
          className="absolute right-2 top-2 flex cursor-pointer items-center border-none bg-transparent text-primary no-underline"
          onClick={() => downloadChartAsImage(chartRef, title)}
        >
          <IoDownloadOutline size={18} />
        </button>
      )}
    </div>
  )
}

export default FilledAreaChart
