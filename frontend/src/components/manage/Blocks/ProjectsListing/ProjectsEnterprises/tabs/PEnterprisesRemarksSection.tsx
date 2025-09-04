import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getIsInputInvalid, handleChangeTextValues } from '../utils'
import { tableColumns, textAreaClassname } from '../../constants'
import { EnterpriseDataProps } from '../../interfaces'

import { TextareaAutosize } from '@mui/material'
import cx from 'classnames'

const PEnterprisesRemarksSection = ({
  enterpriseData,
  setEnterpriseData,
  hasSubmitted,
  errors = {},
}: EnterpriseDataProps) => {
  const sectionId = 'remarks'
  const sectionData = enterpriseData[sectionId]
  const { remarks } = sectionData

  return (
    <>
      <Label>{tableColumns.remarks}</Label>
      <TextareaAutosize
        value={remarks}
        onChange={(event) =>
          handleChangeTextValues(sectionId, 'remarks', setEnterpriseData, event)
        }
        className={cx(textAreaClassname + ' !min-w-[45rem]', {
          'border-red-500': getIsInputInvalid(hasSubmitted, errors['remarks']),
        })}
        minRows={5}
        tabIndex={-1}
      />
    </>
  )
}

export default PEnterprisesRemarksSection
