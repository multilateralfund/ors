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
    labels: [
      '1991-1993',
      '1994-1996',
      '1997-1999',
      '2000-2002',
      '2003-2005',
      '2006-2008',
      '2009-2011',
      '2012-2014',
      '2015-2017',
      '2018-2020',
      '2021-2023',
    ],
  })

  const backgroundColorPlugin = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart) => {
      const { ctx } = chart
      ctx.save()
      ctx.fillStyle = '#FFFFFF' // Set canvas background color to white
      ctx.fillRect(0, 0, chart.width, chart.height)
      ctx.restore()
    },
  }

  const options = {
    layout: {
      padding: 10,
    },
    plugins: { customCanvasBackgroundColor: true },
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
  }

  const downloadChartAsImage = () => {
    const chart = chartRef.current
    if (!chart) return

    // Get base64 image with white background
    const url = chart.toBase64Image('image/jpeg', 1.0)
    const link = document.createElement('a')
    link.href = url
    link.download = 'chart.jpg'
    link.click()
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
            onClick={downloadChartAsImage}
          >
            <IoDownloadOutline size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

export default BarChart
