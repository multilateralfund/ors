import React, { useCallback, useMemo, useState } from 'react'
import { GlobalRequestParams } from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/types.ts'
import { initialGlobalRequestParams } from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/initialData.ts'
import { formatApiUrl } from '@ors/helpers'
import { Box, Button, Divider } from '@mui/material'
import SummaryOfProjectsFilters from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/SummaryOfProjectsFilters.tsx'
import Link from '@ors/components/ui/Link/Link.tsx'
import BlanketApprovalDetailsTable from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/BlanketApprovalDetailsTable.tsx'

const BlanketApprovalDetails = () => {
  const [globalRequestParams, setGlobalRequestParams] =
    useState<GlobalRequestParams>(initialGlobalRequestParams())
  const [previewParams, setPreviewParams] =
    useState<GlobalRequestParams | null>(null)
  const downloadUrl = useMemo(() => {
    const encodedParams = new URLSearchParams(globalRequestParams).toString()
    return formatApiUrl(`api/blanket-approval-details/export?${encodedParams}`)
  }, [globalRequestParams])

  const handlePreview = useCallback(() => {
    setPreviewParams(globalRequestParams)
  }, [globalRequestParams, setPreviewParams])

  return (
    <>
      <Box className="shadow-none">
        <div className="gap-2 sm:flex-wrap md:flex">
          <SummaryOfProjectsFilters
            requestParams={globalRequestParams}
            setRequestParams={setGlobalRequestParams}
          />
          <Box className="shadow-none">
            <div className="mt-4 flex gap-x-2">
              <Button
                size="large"
                variant="contained"
                disabled={
                  !globalRequestParams.meeting_id ||
                  Object.values(globalRequestParams).join() ===
                    Object.values(previewParams ?? []).join()
                }
                onClick={handlePreview}
              >
                Preview report
              </Button>
              <Link
                button
                disabled={!globalRequestParams.meeting_id}
                size="large"
                href={downloadUrl}
                variant="contained"
              >
                Download report
              </Link>
            </div>
          </Box>
        </div>
        <Divider className="my-2 border-0" />
        {previewParams ? (
          <BlanketApprovalDetailsTable globalRequestParams={previewParams} />
        ) : null}
      </Box>
    </>
  )
}

export default BlanketApprovalDetails
