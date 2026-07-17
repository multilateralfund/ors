import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'

import { Divider } from '@mui/material'

const PCROverview = () => {
  const sectionIdentifier = 'overview'

  const {
    PCRData,
    setPCRData,
    financialFiguresTypeOptions,
    projectGoalsAchievedOptions,
    ratingOptions,
    completionReportDoneByOptions,
  } = useContext(PCRDataContext)

  const sectionData = PCRData[sectionIdentifier] || []

  console.log(PCRData)

  return (
    <>
      PCR prefilled
      <Divider className="my-6" />
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="financial_figures_type"
            options={financialFiguresTypeOptions}
            errors={{}}
          />
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="financial_figures_type_explanation"
            errors={{}}
          />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="project_goals_achieved"
            options={projectGoalsAchievedOptions}
            errors={{}}
          />
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="project_goals_achieved_explanation"
            errors={{}}
          />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="rating"
            options={ratingOptions}
            errors={{}}
          />
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="rating_explanation"
            errors={{}}
          />
        </div>
        <PCRSelectWidget
          {...{ PCRData, setPCRData, sectionIdentifier }}
          field="completion_report_done_by"
          options={completionReportDoneByOptions}
          errors={{}}
        />
      </div>
    </>
  )
}

export default PCROverview
