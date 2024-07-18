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

import {
  COMMON_OPTIONS,
  backgroundColorPlugin,
  downloadChartAsImage,
} from '@ors/components/manage/Blocks/Replenishment/Dashboard/chartUtils'

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

const TwoAreaCharts = ({ data, title }) => {
  const chartRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const { payments, pledged_contributions } = data

  const chartData = useMemo(() => {
    return {
      datasets: [
        {
          backgroundColor: 'rgba(235, 255, 0, 0.2)',
          borderColor: '#A4B200',
          borderWidth: 2,
          data: payments.map((item) => item.total_payments),
          fill: 'origin',
          label: 'Total Payments',
        },
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
  }, [pledged_contributions, payments])

  const options = {
    interaction: {
      intersect: false,
      mode: 'index', // Show tooltip for all datasets at the same index
    },
    plugins: { customCanvasBackgroundColor: true },
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

export default TwoAreaCharts
