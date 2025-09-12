import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { EnterpriseOverview } from '../interfaces'

export const handleChangeSelectValues = (
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseOverview>>,
  value: any,
  isMultiple: boolean,
) => {
  setEnterpriseData((prevData) => ({
    ...prevData,
    [field]: isMultiple
      ? value.map((val: any) => val.id ?? [])
      : (value?.id ?? null),
  }))
}

export const handleChangeTextValues = (
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseOverview>>,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  setEnterpriseData((prevData) => ({
    ...prevData,
    [field]: event.target.value,
  }))
}

export const handleChangeNumericValues = (
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseOverview>>,
  event: ChangeEvent<HTMLInputElement>,
) => {
  const initialValue = event.target.value
  const value = initialValue === '' ? null : initialValue

  if (!isNaN(Number(value))) {
    setEnterpriseData((prevData) => ({
      ...prevData,
      [field]: value,
    }))
  } else {
    event.preventDefault()
  }
}
