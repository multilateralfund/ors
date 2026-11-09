import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PCRArchiveIndividual from './PCRArchiveIndividual'
import { SubmissionStatus } from '../PCRSubmission/EditHelperComponents'
import {
  ArchiveVersionsList,
  LegacyPCRIcon,
} from '../PCRArchive/PCRArchiveTabs/ArchiveHelperComponents'
import { useGetArchiveIndividualPCR } from '../hooks/useGetArchiveIndividualPCR'

import { Redirect, useParams } from 'wouter'

const PCRArchiveIndividualWrapper = () => {
  const { archive_id } = useParams<Record<string, string>>()
  const pcr = useGetArchiveIndividualPCR(archive_id)

  const [showVersionsMenu, setShowVersionsMenu] = useState(false)

  const loading = pcr.loading || !pcr.loaded

  if (pcr.error) {
    return <Redirect to="/pcr" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && !!pcr.data && (
        <>
          <HeaderTitle>
            <div className="flex flex-col">
              <div className="flex flex-row flex-wrap gap-2">
                <RedirectBackButton />
                <div className="mb-3 flex gap-2 text-lg uppercase tracking-[0.05em] text-[#4D4D4D]">
                  <span>/</span>
                  <span>View PCR</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 lg:flex-nowrap">
                <PageHeading className="min-w-0 basis-full lg:basis-auto">
                  <span className="font-medium text-[#4D4D4D]">View PCR: </span>
                  {pcr.data.title ? (
                    <span>
                      {pcr.data.title} (
                      {pcr.data.code ?? pcr.data.legacy_code ?? 'N/A'})
                    </span>
                  ) : (
                    <span>
                      {pcr.data.code ?? pcr.data.legacy_code ?? 'N/A'}
                    </span>
                  )}
                </PageHeading>
                <div className="shrink-0">
                  <ArchiveVersionsList
                    pcr={pcr.data}
                    archivePath="archive-individual"
                    {...{ showVersionsMenu, setShowVersionsMenu }}
                  />
                </div>
                <div className="ml-auto shrink-0">
                  <CancelLinkButton title="Cancel" href="/pcr" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {SubmissionStatus(pcr.data.status)}
              <LegacyPCRIcon size="large" className="mt-4" />
            </div>
          </HeaderTitle>
          <PCRArchiveIndividual pcr={pcr.data} />
        </>
      )}
    </>
  )
}

export default PCRArchiveIndividualWrapper
