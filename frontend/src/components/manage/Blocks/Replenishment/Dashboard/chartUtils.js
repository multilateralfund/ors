export const backgroundColorPlugin = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart) => {
    const { ctx } = chart
    ctx.save()
    ctx.fillStyle = '#FFFFFF' // Set canvas background color to white
    ctx.fillRect(0, 0, chart.width, chart.height)
    ctx.restore()
  },
}

export const downloadChartAsImage = (chartRef, fileName) => {
  const chart = chartRef.current
  if (!chart) return

  // Get base64 image with white background
  const url = chart.toBase64Image('image/jpeg', 1.0)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.toLowerCase().replaceAll(' ', '_') + '_chart.jpeg'
  link.click()
}


export const COMMON_OPTIONS = (color) => ({
  layout: {
    padding: 10,
  },
  maintainAspectRatio: false,
  responsive: true,
  scales: {
    x: {
      border: {
        color: color,
        width: 2,
      },
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      border: {
        display: false,
      },
      ticks: {
        callback: function (value) {
          return value.toLocaleString()
        },
        padding: 10,
      },
    },
  },
  tension: 0, // Adjust line curve
})
