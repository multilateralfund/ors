import Link from 'next/link'

function SectionStatistics() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          className="m-0 text-2xl text-primary no-underline print:hidden"
          href="./"
        >
          DASHBOARD
        </Link>{' '}
        <span className="print:hidden"> | </span>
        <Link
          className="m-0 text-2xl text-primary no-underline print:hidden"
          href="./status"
        >
          STATUS OF THE FUND
        </Link>{' '}
        <span className="print:hidden"> | </span>
        <h2 className="m-0 text-3xl">STATISTICS</h2>
      </div>
      <div>not implemented</div>
    </>
  )
}

export default SectionStatistics
