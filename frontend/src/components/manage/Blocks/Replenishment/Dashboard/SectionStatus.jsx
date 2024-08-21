import cx from 'classnames'
import Link from 'next/link'

import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'
import { SubmitButton } from '@ors/components/ui/Button/Button'

const incomeOrder = [
  'cash_payments',
  'promissory_notes',
  'bilateral_assistance',
  'interest_earned',
  'miscellaneous_income',
  'total',
]

const allocationsOrder = ['undp', 'unep', 'unido', 'world_bank', 'total']
const provisionsOrder = [
  'staff_contracts',
  'treasury_fees',
  'monitoring_fees',
  'technical_audit',
  'information_strategy',
  'bilateral_assistance',
  'gain_loss',
  'total',
]

function CashCard(props) {
  const { className, label, sub_text, value } = props
  return (
    <li
      className={cx(
        ' flex min-h-24 min-w-80 flex-1 items-center justify-between rounded-lg bg-[#F5F5F5] p-4 md:min-w-96 print:break-inside-avoid',
        className,
      )}
    >
      <div className="">
        <div className="text-xl font-medium">{label}</div>
        <div className="text-lg font-normal">{sub_text}</div>
      </div>
      <div className="text-2xl font-bold leading-normal">{value}</div>
    </li>
  )
}

function SectionStatus(props) {
  const { allocations, asOfDate, income, onEditButtonClick, provisions, showEditButton } =
    props

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            className="m-0 text-2xl text-primary no-underline print:hidden"
            href="./"
          >
            DASHBOARD
          </Link>{' '}
          <span className="print:hidden"> | </span>
          <h2 className="m-0 text-3xl">STATUS OF THE FUND</h2>{' '}
          <span className="print:hidden"> | </span>
          <Link
            className="m-0 text-2xl text-primary no-underline print:hidden"
            href="./statistics"
          >
            STATISTICS
          </Link>
        </div>
        {showEditButton && (
          <SubmitButton
            className="tracking-widest print:hidden"
            onClick={onEditButtonClick}
          >
            Edit
          </SubmitButton>
        )}
      </div>
      <div>
        <p className="m-0 text-2xl">{asOfDate} ( USD )</p>
      </div>

      <div
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className="print:break-inside-avoid">
          <h3 className="text-2xl">INCOME</h3>

          <ul className="flex list-none flex-wrap items-stretch gap-4 pl-0">
            {income &&
              incomeOrder.map((key) => (
                <CashCard
                  key={key}
                  className={key === 'total' ? '!bg-primary text-white' : ''}
                  label={income[key].label}
                  value={
                    income[key].value !== null
                      ? formatNumberValue(income[key].value, 0, 0)
                      : 'N/A'
                  }
                />
              ))}
          </ul>
        </div>

        <div className="print:break-inside-avoid">
          <h3 className="text-2xl">ALLOCATIONS AND PROVISIONS</h3>

          <ul className="flex list-none flex-wrap items-stretch gap-4 pl-0">
            {allocations &&
              allocationsOrder.map((key) => (
                <CashCard
                  key={key}
                  className={key === 'total' ? '!bg-primary text-white' : ''}
                  label={allocations[key].label}
                  value={
                    allocations[key].value !== null
                      ? formatNumberValue(allocations[key].value, 0, 0)
                      : 'N/A'
                  }
                />
              ))}
          </ul>
          <ul className="flex list-none flex-wrap justify-between gap-4 pl-0">
            {provisions &&
              provisionsOrder.map((key) => (
                <CashCard
                  key={key}
                  className={
                    key === 'total' ? 'ml-auto !bg-primary text-white' : ''
                  }
                  label={provisions[key].label}
                  sub_text={provisions[key].sub_text}
                  value={
                    provisions[key].value !== null
                      ? formatNumberValue(provisions[key].value, 0, 0)
                      : 'N/A'
                  }
                />
              ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="my-0">
          <sup>*</sup> Includes interest amount US $1,553,069 earned by FECO/MEP
          (China).
        </p>
        <p className="my-0">
          <sup>**</sup> Amounts reflect net approvals for which resources are
          transferred to Implementing Agencies. The Secretariat budget reflects
          actual costs as per the final 2021 and preliminary 2022 accounts of
          the Fund and approved amounts for 2020 - 2025.
        </p>
        <p className="my-0">
          <sup>***</sup> This amount includes US $246 million balance carried
          forward from 2018-2020 triennium, which is to be used after 2023 as
          per the fifth extraordinary MoP decision Ex.V/1(2){' '}
        </p>
      </div>
    </>
  )
}

export default SectionStatus
