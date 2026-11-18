import { useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { pcrExportFormats, pcrExportSections } from '../constants'
import { api } from '@ors/helpers'

import {
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Modal,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import { find, map, omit } from 'lodash'

const allSectionIds = map(pcrExportSections, 'id')

const PCRBulkExtractionModal = ({
  open,
  onClose,
  params,
  pcrCount,
}: {
  open: boolean
  onClose: () => void
  params: Record<string, any>
  pcrCount: number
}) => {
  const [_, setLocation] = useLocation()

  const [sections, setSections] = useState<string[]>(allSectionIds)
  const [outputFormat, setOutputFormat] = useState('pdf')
  const [isProcessing, setIsProcessing] = useState(false)

  const allSelected = sections.length === allSectionIds.length

  const toggleSection = (sectionId: string) => {
    setSections((selected) =>
      selected.includes(sectionId)
        ? selected.filter((id) => id !== sectionId)
        : [...selected, sectionId],
    )
  }

  const startExport = async () => {
    setIsProcessing(true)

    try {
      const pcrExport = await api('api/pcr-metaprojects/export_pcrs/', {
        method: 'POST',
        // the PCRs of the listing, with all its filters
        params: omit(params, ['limit', 'offset']),
        data: { output_format: outputFormat, sections },
      })

      setLocation(`/pcr/exports/${pcrExport.id}`)
    } catch (error) {
      const data =
        error instanceof Response ? await error.json().catch(() => null) : null

      enqueueSnackbar(
        <>
          {data?.detail ?? 'The export could not be started. Please try again.'}
        </>,
        { variant: 'error' },
      )
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
    }
  }

  return (
    <Modal
      aria-labelledby="pcr-bulk-extraction-modal"
      open={open}
      onClose={handleClose}
    >
      <Box className="flex max-h-[90vh] w-full max-w-[90%] flex-col overflow-y-auto px-0 absolute-center md:max-w-2xl">
        <Typography
          id="pcr-bulk-extraction-modal"
          className="mx-6 mb-1 mt-1 text-2xl font-medium"
        >
          Bulk extraction
        </Typography>
        <Typography className="mx-6 mb-4 text-lg text-[#4D4D4D]">
          {pcrCount} PCR{pcrCount === 1 ? '' : 's'} matching the filters applied
          in the listing.
        </Typography>
        <div className="mb-4 flex flex-col gap-4 bg-common-containerBg p-6 text-lg">
          <div className="flex flex-col">
            <Typography className="mb-1 text-lg font-medium">
              Sections
            </Typography>
            <FormControlLabel
              className="w-fit"
              label="Select all"
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={sections.length > 0 && !allSelected}
                  onChange={() => setSections(allSelected ? [] : allSectionIds)}
                  sx={{ color: 'black' }}
                  size="small"
                />
              }
            />
            <div className="ml-6 grid grid-cols-1 sm:grid-cols-2">
              {map(pcrExportSections, ({ id, label }) => (
                <FormControlLabel
                  key={id}
                  className="w-fit"
                  label={label}
                  control={
                    <Checkbox
                      checked={sections.includes(id)}
                      onChange={() => toggleSection(id)}
                      sx={{ color: 'black' }}
                      size="small"
                    />
                  }
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <Typography className="mb-1 text-lg font-medium">Format</Typography>
            <RadioGroup
              row
              aria-label="Export format"
              value={outputFormat}
              onChange={(event) => setOutputFormat(event.target.value)}
            >
              {map(pcrExportFormats, ({ id, label }) => (
                <FormControlLabel
                  key={id}
                  value={id}
                  label={label}
                  control={<Radio sx={{ color: 'black' }} size="small" />}
                />
              ))}
            </RadioGroup>
            <Typography className="text-base text-[#4D4D4D]">
              {find(pcrExportFormats, { id: outputFormat })?.description}
            </Typography>
          </div>
        </div>
        <div className="mr-6 flex flex-wrap justify-end gap-3">
          <CustomLink
            className="h-10 px-4 py-2 text-lg uppercase"
            onClick={startExport}
            disabled={isProcessing || sections.length === 0}
            href={null}
            color="secondary"
            variant="contained"
            button
          >
            Extract
          </CustomLink>
          <CancelButton onClick={handleClose} />
          {isProcessing && (
            <CircularProgress
              className="mb-1 ml-1.5 mt-auto"
              color="inherit"
              size="30px"
            />
          )}
        </div>
      </Box>
    </Modal>
  )
}

export default PCRBulkExtractionModal
