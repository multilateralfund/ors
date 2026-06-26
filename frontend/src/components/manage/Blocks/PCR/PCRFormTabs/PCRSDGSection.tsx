import { PCRData, PCRSectionsProps, PCRSdgContribution } from '../interfaces'
import { SubmitButton } from '../../ProjectsListing/HelperComponents'
import { widgets } from './SpecificFieldsHelpers'

import { find, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider, Tab } from '@mui/material'
import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { useContext, useState } from 'react'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { Tabs } from '@mui/material'
import { initialSDGs, sdgOpts } from '../constants'

const PCRSDGSection = ({
  PCRData,
  setPCRData,
  errors,
  setCurrentTab,
}: PCRSectionsProps & { errors: { [key: string]: string[] } }) => {
  const sectionIdentifier = 'sdg_contribution'
  const sdgsField = 'sdgs'

  const sdgData = PCRData[sectionIdentifier] || []

  const onAddSDG = (index: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((agency, indexData) =>
          indexData === index
            ? { ...agency, [sdgsField]: [...agency[sdgsField], initialSDGs] }
            : agency,
        ),
      }
    }, sdgsField)
  }

  const onRemoveSDG = (index: number, index2: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((agency, indexData) =>
          indexData === index2
            ? {
                ...agency,
                [sdgsField]: agency[sdgsField].filter(
                  (_, index3) => index3 !== index,
                ),
              }
            : agency,
        ),
      }
    }, sdgsField)
  }

  const { agencies } = useContext(ProjectsDataContext)

  console.log(sdgData)
  const [crtAgency, setCrtAgency] = useState(0)

  const crtAgencies = map(
    sdgData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency)?.name,
  )

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <>
          <div>
            <Tabs
              aria-label="sdg-tabs"
              className="sectionsTabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              TabIndicatorProps={{
                className: 'h-0',
                style: { transitionDuration: '150ms' },
              }}
              value={crtAgency}
              onChange={(_, newValue) => {
                setCrtAgency(newValue)
              }}
            >
              {crtAgencies.map((agency) => (
                <Tab
                  key={agency}
                  aria-controls={agency}
                  id={agency}
                  label={agency}
                />
              ))}
            </Tabs>
            <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
              {crtAgencies
                .filter((_, index) => index === crtAgency)
                .map(() => {
                  const sdgsData = sdgData[crtAgency][sdgsField] || []

                  return (
                    <span key={crtAgency}>
                      <div className="flex flex-col gap-y-2">
                        <div className="flex flex-col flex-wrap gap-x-20">
                          {map(sdgsData, (_, index) => (
                            <span key={index}>
                              <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                                {widgets['drop_down']<
                                  PCRData,
                                  PCRSdgContribution
                                >(
                                  PCRData,
                                  setPCRData,
                                  sectionIdentifier,
                                  'sdg_id',
                                  sdgOpts,
                                  errors,
                                  [crtAgency, index],
                                  ['', 'sdgs'],
                                )}
                                {widgets['text_area']<
                                  PCRData,
                                  PCRSdgContribution
                                >(
                                  PCRData,
                                  setPCRData,
                                  sectionIdentifier,
                                  'description',
                                  errors,
                                  [crtAgency, index],
                                  ['', 'sdgs'],
                                )}

                                <IoTrash
                                  className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                                  size={16}
                                  onClick={() => {
                                    onRemoveSDG(index, crtAgency)
                                  }}
                                />
                              </div>
                              {index !== sdgsData.length - 1 && (
                                <Divider className="my-5" />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                      <SubmitButton
                        title="Add sdg"
                        onSubmit={() => onAddSDG(crtAgency)}
                        className="mr-auto h-8"
                      />
                    </span>
                  )
                })}
            </div>
          </div>
        </>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton setCurrentTab={setCurrentTab} />
      </div>
    </>
  )
}

export default PCRSDGSection
