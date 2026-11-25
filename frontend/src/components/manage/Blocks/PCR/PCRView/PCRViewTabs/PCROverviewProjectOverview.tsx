import { Fragment, useContext, useState } from 'react'

import { formatFieldLabel } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRImpactIndicators from './PCRImpactIndicators'
import {
  SubSectionTitle,
  NoDataReported,
  getCollapseIcon,
  detailItem,
  dateDetailItem,
  numberDetailItem,
} from './ViewHelperComponents'
import { pcrFieldsMapping, borderedContainerClassname } from '../../constants'
import { PCRAlternativeTechnologyType } from '../../interfaces'
import { getValueToDisplay } from '../../utils'
import { useStore } from '@ors/store'

import { find, groupBy, map, orderBy, uniq } from 'lodash'
import { HiArrowLongRight } from 'react-icons/hi2'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PCROverviewProjectOverview = ({
  numberEnterprises,
  alternativeTechnologies,
  isEditable = false,
}: {
  numberEnterprises: string
  alternativeTechnologies: PCRAlternativeTechnologyType[]
  isEditable?: boolean
}) => {
  const { countries } = useContext(ProjectsDataContext)
  const { pcrMetaproject, pcrDefaultData, substanceOptions } =
    useContext(PCRDataContext)

  const [isAltTechsExpanded, setIsAltTechsExpanded] = useState(false)

  const { data: defaultData } = pcrDefaultData
  const { country, decisions } = defaultData || {}

  const countryValue = find(countries, (c) => c.id === country) ?? null

  const { data: metaprojectData } = pcrMetaproject
  const { umbrella_code } = metaprojectData || {}

  const bpSlice = useStore((state) => state.businessPlans)
  const allDecisions = bpSlice.decisions.data

  const decisionsValues = map(
    uniq(decisions),
    (decision) => find(allDecisions, (d) => d.id === decision)?.title,
  ).join(', ')

  const alternativeTechnologiesData = orderBy(
    map(
      groupBy(
        alternativeTechnologies,
        ({ substance_from, substance_to }) =>
          `${substance_from}-${substance_to}`,
      ),
      (entries) => ({
        substanceFrom: getValueToDisplay(
          substanceOptions,
          entries[0].substance_from,
        ),
        substanceTo: getValueToDisplay(
          substanceOptions,
          entries[0].substance_to,
        ),
        nrEntries: entries.length,
      }),
    ),
    'nrEntries',
    'desc',
  )

  const fieldsValues = [
    detailItem(pcrFieldsMapping.country, countryValue?.name ?? ''),
    detailItem(pcrFieldsMapping.metacode, umbrella_code ?? ''),
    dateDetailItem(
      pcrFieldsMapping.project_date_approved,
      (defaultData?.project_date_approved as string) ?? '',
    ),
    dateDetailItem(
      pcrFieldsMapping.project_date_completion,
      (defaultData?.project_date_completion as string) ?? '',
    ),
    numberDetailItem(
      pcrFieldsMapping.phase_out_ods_approved,
      defaultData?.phase_out_ods_approved as string,
      'decimal',
    ),
    numberDetailItem(
      pcrFieldsMapping.phase_out_ods_actual,
      defaultData?.phase_out_ods_actual as string,
      'decimal',
    ),
    numberDetailItem(
      formatFieldLabel(pcrFieldsMapping.phase_out_co2_eq_t_approved),
      defaultData?.phase_out_co2_eq_t_approved as string,
      'decimal',
    ),
    numberDetailItem(
      formatFieldLabel(pcrFieldsMapping.phase_out_co2_eq_t_actual),
      defaultData?.phase_out_co2_eq_t_actual as string,
      'decimal',
    ),
    // numberDetailItem(
    //   pcrFieldsMapping.total_number_of_enterprises,
    //   numberEnterprises,
    //   'number',
    // ),
  ]

  return (
    <div className={cx('mb-9 flex flex-col', borderedContainerClassname)}>
      <div className="bg-[#f4f5f6] px-6 py-4">
        <SubSectionTitle>Project overview</SubSectionTitle>
      </div>
      <div className="border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 lg:grid-cols-4 [&_h4]:break-words">
          {map(fieldsValues, (item, index) => (
            <div key={index} className="flex flex-col justify-between">
              {item}
              <Divider className="my-4" />
            </div>
          ))}
        </div>
        <div className="w-full lg:w-[85%]">
          {detailItem(pcrFieldsMapping.decisions, decisionsValues ?? '')}
        </div>
        <Divider className="my-4" />
        <div className="grid w-fit max-w-full grid-cols-[minmax(0,auto)_auto] items-center gap-x-6 gap-y-3 text-primary sm:gap-x-20">
          <span
            className="mb-1 flex cursor-pointer items-start gap-x-2 self-baseline text-xl font-bold"
            onClick={() => setIsAltTechsExpanded(!isAltTechsExpanded)}
          >
            <span className="mt-0.5 flex shrink-0">
              {getCollapseIcon(isAltTechsExpanded)}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 self-baseline">
              Baseline substance
              <HiArrowLongRight size={24} />
              replacement technology
            </span>
          </span>
          {isAltTechsExpanded &&
            (alternativeTechnologiesData.length > 0 ? (
              <>
                <span className="self-baseline text-[#4D4D4D]">Projects</span>
                {map(
                  alternativeTechnologiesData,
                  ({ substanceFrom, substanceTo, nrEntries }) => {
                    const isHCFC = substanceFrom.startsWith('HCFC')
                    const isHFC = substanceFrom.startsWith('HFC')

                    return (
                      <Fragment key={`${substanceFrom}-${substanceTo}`}>
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={cx(
                              'max-w-[50%] shrink-0 cursor-default truncate text-base',
                              {
                                'rounded-full px-3 py-0.5 font-medium':
                                  isHCFC || isHFC,
                                'bg-[#e6d7f8] text-[#6b4f9e]': isHCFC,
                                'bg-[#e6f0f4] text-[#4a7189]': isHFC,
                              },
                            )}
                            title={substanceFrom}
                          >
                            {substanceFrom || '-'}
                          </span>
                          <HiArrowLongRight size={16} className="shrink-0" />
                          <span
                            className="min-w-0 cursor-default truncate text-base"
                            title={substanceTo}
                          >
                            {substanceTo || '-'}
                          </span>
                        </div>
                        <span className="justify-self-end font-medium">
                          {nrEntries}
                        </span>
                      </Fragment>
                    )
                  },
                )}
              </>
            ) : (
              <div className="col-span-2">
                <NoDataReported text="No data reported." />
              </div>
            ))}
        </div>
        <Divider className="my-4" />
        <PCRImpactIndicators isEditable={isEditable} />
      </div>
    </div>
  )
}

export default PCROverviewProjectOverview
