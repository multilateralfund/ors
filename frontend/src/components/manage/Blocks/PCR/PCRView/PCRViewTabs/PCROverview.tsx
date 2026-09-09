import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import { detailItem } from './ViewHelperComponents'
import { defaultColDef, pcrFieldsMapping } from '../../constants'
import { PCRResponse } from '../../interfaces'
import { getOtherOptionId } from '../../utils'

import { Divider } from '@mui/material'
import { SectionTitle } from '../../../ProjectsListing/ProjectsCreate/ProjectsCreate'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import { GetRowIdParams } from 'ag-grid-community'

const PCROverview = ({ pcr }: { pcr: PCRResponse }) => {
  const { ratingOptions } = useContext(PCRDataContext)

  return (
    <>
      <PCROverviewPrefilledData {...{ pcr }} />
      <Divider className="my-6" />
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          {detailItem(
            pcrFieldsMapping.financial_figures_status,
            pcr.financial_figures_status,
          )}
          {detailItem(
            pcrFieldsMapping.financial_figures_status_explanation,
            pcr.financial_figures_status_explanation,
            { detailClassname: 'self-start' },
          )}
        </div>
        <div className="flex">
          {detailItem(pcrFieldsMapping.addresses, pcr.addresses, {
            detailClassname: 'self-start',
          })}
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          {detailItem(
            pcrFieldsMapping.project_goal_achieved,
            pcr.project_goal_achieved,
          )}
          {detailItem(
            pcrFieldsMapping.project_goal_achieved_explanation,
            pcr.project_goal_achieved_explanation,
            { detailClassname: 'self-start' },
          )}
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          {detailItem(pcrFieldsMapping.rating, pcr.rating)}
          {pcr.rating === getOtherOptionId(ratingOptions) &&
            detailItem(
              pcrFieldsMapping.rating_explanation_other,
              pcr.rating_explanation_other,
              { detailClassname: 'self-start' },
            )}
        </div>
        <div className="flex">
          {detailItem(
            pcrFieldsMapping.rating_explanation,
            pcr.rating_explanation,
            { detailClassname: 'self-start' },
          )}
        </div>
        <div className="flex flex-col">
          <SectionTitle>Additional comments</SectionTitle>
          <ViewTable
            rowData={pcr.additional_comments ?? []}
            enablePagination={false}
            suppressCellFocus={true}
            withSeparators={true}
            className="mb-4"
            columnDefs={[
              {
                headerName: pcrFieldsMapping.entity,
                field: 'entity',
                tooltipField: 'entity',
                cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
                minWidth: 130,
              },
              {
                headerName: pcrFieldsMapping.comment,
                field: 'comment',
                tooltipField: 'comment',
                cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
                minWidth: 180,
              },
            ]}
            defaultColDef={defaultColDef}
            getRowId={(props: GetRowIdParams) => props.data.id}
          />
        </div>
        {detailItem(pcrFieldsMapping.completed_by, pcr.completed_by)}
      </div>
    </>
  )
}

export default PCROverview
