import cx from 'classnames'

import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'
import { SubmitButton } from '@ors/components/ui/Button/Button'

import {
  IALLOCATIONS,
  IINCOME,
  IOVERVIEW,
  IPROVISIONS,
} from '../Dashboard/useGetDashboardDataTypes'

import { IoInformationCircleOutline } from 'react-icons/io5'

const incomeOrder: (keyof IINCOME)[] = [
  'cash_payments',
  'promissory_notes',
  'bilateral_assistance',
  'interest_earned',
  'miscellaneous_income',
]

const allocationsOrder: (keyof IALLOCATIONS)[] = [
  'undp',
  'unep',
  'unido',
  'world_bank',
]
const provisionsOrder: (keyof IPROVISIONS)[] = [
  'staff_contracts',
  'treasury_fees',
  'monitoring_fees',
  'technical_audit',
  'information_strategy',
  'bilateral_assistance',
  'gain_loss',
]

interface ICashCardProps {
  className?: string
  label: React.ReactNode
  sub_text?: string
  value: null | number | string
}

function CashCard(props: ICashCardProps) {
  const { className, label, sub_text, value } = props
  return (
    <div
      className={cx(
        'flex min-h-24 min-w-80 flex-1 items-center justify-between rounded-lg bg-[#F5F5F5] p-4 md:min-w-96 print:break-inside-avoid',
        className,
      )}
    >
      <div className="w-1/2">
        <div className="text-3xl font-bold uppercase text-[#4D4D4D]">
          {label}
        </div>
      </div>
      <div className="text-3xl leading-normal">
        <span className="font-light">$</span>
        {value}
      </div>
    </div>
  )
}

interface IMiniCashCardProps {
  className?: string
  info_text?: string
  label: React.ReactNode
  value: null | number | string
}

function MiniCashCard(props: IMiniCashCardProps) {
  const { className, info_text, label, value } = props
  return (
    <div className={cx('flex flex-col gap-y-2', className)}>
      <div className="uppercase text-[#4D4D4D]">
        <div className="flex items-center">
          <span className="whitespace-break-spaces">
            <span className="text-2xl font-bold">{label}</span>
            {info_text ? (
              <IoInformationCircleOutline
                className="inline"
                title={info_text}
              />
            ) : null}
          </span>
        </div>
      </div>
      <div className="flex-grow"></div>
      <div className="text-2xl">
        <span className="font-light">$</span>
        {value}
      </div>
    </div>
  )
}

interface IStatusOfTheFundProps {
  allocations: IALLOCATIONS
  asOfDate: string
  income: IINCOME
  onEditButtonClick: () => void
  overview: IOVERVIEW
  provisions: IPROVISIONS
  showEditButton: boolean
}

function StatusOfTheFundView(props: IStatusOfTheFundProps) {
  const {
    allocations,
    asOfDate,
    income,
    onEditButtonClick,
    overview,
    provisions,
    showEditButton,
  } = props

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="py-4">
          <p className="m-0 text-2xl">{asOfDate} ( USD )</p>
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

      <div
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className="py-4">
          <div className="flex flex-wrap gap-4 2xl:flex-nowrap">
            <div className="flex w-full flex-col gap-y-2 lg:w-[49%] 2xl:w-1/4">
              <CashCard
                label={<div className="max-w-0">{income?.total.label}</div>}
                value={
                  income?.total.value !== null
                    ? formatNumberValue(income?.total.value, 0, 0)
                    : 'N/A'
                }
              />
              <CashCard
                label={allocations?.total.label}
                value={
                  allocations?.total.value !== null
                    ? formatNumberValue(allocations?.total.value, 0, 0)
                    : 'N/A'
                }
              />
              <CashCard
                label={provisions?.total.label}
                value={
                  provisions?.total.value !== null
                    ? formatNumberValue(provisions?.total.value, 0, 0)
                    : 'N/A'
                }
              />
              <CashCard
                label={overview?.balance.label}
                value={
                  overview?.balance.value !== null
                    ? formatNumberValue(overview?.balance.value, 0, 0)
                    : 'N/A'
                }
              />
            </div>

            <div className="w-full lg:w-[49%] 2xl:w-1/4">
              <div className="h-full rounded-lg bg-[#F5F5F5] p-4">
                <div className="mb-4 border-x-0 border-b border-t-0 border-solid border-[#E0E0E0] pb-4 text-3xl font-bold uppercase text-[#4D4D4D]">
                  Income
                </div>
                <div className="flex flex-wrap gap-y-11">
                  {income &&
                    incomeOrder.map((key) => (
                      <MiniCashCard
                        key={key}
                        className="w-1/2"
                        info_text={income[key]?.info_text}
                        label={income[key].label}
                        value={
                          income[key].value !== null
                            ? formatNumberValue(income[key].value, 0, 0)
                            : 'N/A'
                        }
                      />
                    ))}
                </div>
              </div>
            </div>

            <div className="w-full 2xl:w-2/4">
              <div className="h-full rounded-lg bg-[#F5F5F5] p-4">
                <div className="mb-4 border-x-0 border-b border-t-0 border-solid border-[#E0E0E0] pb-4 text-3xl font-bold uppercase text-[#4D4D4D]">
                  Allocations
                </div>
                <div className="mb-4 flex gap-4 border-x-0 border-b border-t-0 border-solid border-[#E0E0E0] pb-4 text-[#4D4D4D]">
                  {allocations &&
                    allocationsOrder.map((key) => (
                      <MiniCashCard
                        key={key}
                        className="w-1/4"
                        info_text={allocations[key]?.info_text}
                        label={allocations[key].label}
                        value={
                          allocations[key].value !== null
                            ? formatNumberValue(allocations[key].value, 0, 0)
                            : 'N/A'
                        }
                      />
                    ))}
                </div>
                <div className="flex flex-wrap">
                  {provisions &&
                    provisionsOrder.map((key) => (
                      <MiniCashCard
                        key={key}
                        className="my-6 w-1/4"
                        info_text={provisions[key]?.info_text}
                        label={provisions[key].label}
                        value={
                          provisions[key].value !== null
                            ? formatNumberValue(provisions[key].value, 0, 0)
                            : 'N/A'
                        }
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
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

export default StatusOfTheFundView
