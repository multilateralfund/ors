import Chart from 'chart.js/auto'

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

export const downloadChartAsImage = async (chartRef, title) => {
  const chartInstance = chartRef.current
  if (!chartInstance) {
    console.error('Chart instance is not available.')
    return
  }

  // Clone existing chart configuration
  const newChartConfig = {
    data: JSON.parse(JSON.stringify(chartInstance.config.data)),
    options: JSON.parse(JSON.stringify(chartInstance.config.options)),
    plugins: [backgroundColorPlugin],
    type: chartInstance.config.type,
  }

  // Adjust chart configuration for download dimensions
  newChartConfig.options.devicePixelRatio = window.devicePixelRatio || 1
  newChartConfig.options.animation = false // Disable animations for clarity
  newChartConfig.options.maintainAspectRatio = true
  newChartConfig.options.responsive = false
  newChartConfig.options.plugins.title = {
    display: true,
    font: { size: 20 },
    text: title.toUpperCase(),
  }

  // Create a new canvas element
  const newCanvas = document.createElement('canvas')
  newCanvas.style.width = '1280px'
  newCanvas.style.display = 'none'

  // Ensure canvas element is attached to the DOM before creating chart instance
  // Otherwise the canvas will be empty
  document.body.appendChild(newCanvas)

  const newContext = newCanvas.getContext('2d')

  // Create a new chart instance with the adjusted configuration
  const tempChart = new Chart(newContext, newChartConfig)

  // Render the chart onto the new canvas
  tempChart.render()

  // Wait for a fixed duration to ensure rendering completes
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Get base64 image data URL from the canvas
  const url = newCanvas.toDataURL('image/jpeg', 1.0)

  // Create a temporary link element to trigger download
  const link = document.createElement('a')
  link.href = url
  link.download = `${title.toLowerCase().replaceAll(' ', '_')}_chart.jpeg`
  link.click()

  // Clean up
  newCanvas.remove()
}

export const COMMON_OPTIONS = (color = '#002A3C') => ({
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
