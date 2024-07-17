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

export const downloadChartAsImage = (chartRef) => {
  const chart = chartRef.current
  if (!chart) return

  // Get base64 image with white background
  const url = chart.toBase64Image('image/jpeg', 1.0)
  const link = document.createElement('a')
  link.href = url
  link.download = 'chart.jpg'
  link.click()
}

export const COMMON_OPTIONS = {
  layout: {
    padding: 10,
  },
  maintainAspectRatio: false,
  plugins: { customCanvasBackgroundColor: true },
  responsive: true,
}

export const MOCK_LABELS = [
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
]
