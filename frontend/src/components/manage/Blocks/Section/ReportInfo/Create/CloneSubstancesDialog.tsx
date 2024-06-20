import { UserType } from '@ors/types/user_types'

import React, { useEffect, useState } from 'react'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { each, find, includes } from 'lodash'

import { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'
import Loading from '@ors/components/theme/Loading/Loading'
import { debounce } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

interface CloneSubstancesDialogProps {
  Sections: any
  form: CPBaseForm
  setForm: React.Dispatch<React.SetStateAction<CPBaseForm>>
  user_type: UserType
}

function clonePreviousSubstances(
  Sections: any,
  data: any,
  form: CPBaseForm,
  setForm: React.Dispatch<React.SetStateAction<CPBaseForm>>,
  sections: Array<'section_a' | 'section_b' | 'section_c'>,
) {
  let newForm = { ...form }
  sections.forEach((section) => {
    const previousSubstances = getPreviousSubstances(
      data.previous_substances[section],
      Sections[section],
    )

    newForm = { ...newForm, [section]: previousSubstances }
  })
  setForm((form: CPBaseForm) => ({ ...form, ...newForm }))
}

const getPreviousSubstances = (sectionData: any[], Section: any) => {
  const data: Array<any> = []

  const substancesInForm = sectionData.map((row) => row.id)

  each(
    sectionData.filter((row) => row.substance_id),
    (substance) => {
      if (!includes(substancesInForm, `substance_${substance.substance_id}`)) {
        const transformedSubstance = Section.transformSubstance(
          substance,
          false,
        )
        data.push({
          ...transformedSubstance,
          id: transformedSubstance.display_name,
        })
      }
    },
  )

  each(
    sectionData.filter((row) => row.blend_id),
    (blend) => {
      if (!includes(substancesInForm, `blend_${blend.blend_id}`)) {
        const transformedBlend = Section.transformBlend(blend, false)
        data.push({
          ...transformedBlend,
          id: transformedBlend.display_name,
        })
      }
    },
  )

  return data.toSorted((a, b) => {
    if (a.group === b.group) {
      return a.sort_order - b.sort_order
    }

    if (a.group === 'HCFCs') {
      return -1
    }

    if (a.group === 'HFCs') {
      return 0
    }

    return 1
  })
}

function useFetchPreviousSubstances(country_id: null | number) {
  const { data, loaded, loading, setParams } = useApi({
    options: {
      params: {
        country_id,
      },
      withStoreCache: true,
    },
    path: `api/country-programme/empty-form/`,
  })

  return { data, loaded, loading, setParams }
}

const CloneSubstancesDialog: React.FC<CloneSubstancesDialogProps> = ({
  Sections,
  form,
  setForm,
  user_type,
}) => {
  const isCountryUser = user_type === 'country_user'
  const [open, setOpen] = useState(false)
  const selectedCountry = form.country

  const { data, loaded, loading, setParams } = useFetchPreviousSubstances(
    selectedCountry?.id || null,
  )

  const isDataReady = loaded && !loading && !!data && !!selectedCountry

  useEffect(() => {
    if (isCountryUser) {
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isCountryUser])

  const handleClose = () => {
    setOpen(false)
  }

  useEffect(() => {
    setParams({
      country_id: selectedCountry?.id,
    })
    debounce(() => {
      setOpen(!!selectedCountry)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry])

  const sections: Array<'section_a' | 'section_b' | 'section_c'> = [
    'section_a',
    'section_b',
    'section_c',
  ]

  return (
    <Dialog
      aria-describedby="alert-dialog-description"
      aria-labelledby="alert-dialog-title"
      open={open}
      onClose={handleClose}
    >
      <DialogTitle id="alert-dialog-title">
        {
          'Do you want the Sections A, B and C to contain the substances and blends reported in the previous CP report?'
        }
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="text-pretty"
        >
          This action will clone and <b>overwrite</b> the substances and blends
          from the previous report to the current report.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {isDataReady ? (
          <>
            <Button onClick={handleClose}>No</Button>
            <Button
              onClick={() => {
                clonePreviousSubstances(Sections, data, form, setForm, sections)
                handleClose()
              }}
              autoFocus
            >
              Yes
            </Button>
          </>
        ) : (
          <Loading className="bg-action-disabledBackground" active={loading} />
        )}
      </DialogActions>
    </Dialog>
  )
}

export default CloneSubstancesDialog
