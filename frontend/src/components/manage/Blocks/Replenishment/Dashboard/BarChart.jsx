import React, { useMemo, useRef, useState } from 'react'
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

import {
  COMMON_OPTIONS,
  backgroundColorPlugin,
  downloadChartAsImage,
} from '@ors/components/manage/Blocks/Replenishment/Dashboard/chartUtils'

import { IoDownloadOutline } from 'react-icons/io5'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const BarChart = ({ data, title }) => {
  const chartRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)

  const chartData = useMemo(() => {
    return {
      datasets: [
        {
          backgroundColor: '#002A3C',
          borderColor: '#002A3C',
          borderWidth: 1,
          data: data.map((item) => item.outstanding_pledges),
          label: 'Outstanding Pledges',
        },
      ],
      labels: data.map((item) => `${item.start_year}-${item.end_year}`),
    }
  }, [data])

  const options = {
    plugins: { customCanvasBackgroundColor: true, legend: { display: false } },
    ...COMMON_OPTIONS(),
  }

  return (
    <div
      className="relative h-96 w-full print:break-inside-avoid"
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
          className="absolute right-2 -top-2 flex cursor-pointer items-center border-none bg-transparent text-primary no-underline"
          onClick={() => downloadChartAsImage(chartRef, title)}
        >
          <IoDownloadOutline size={18} />
        </button>
      )}
    </div>
  )
}

export default BarChart
