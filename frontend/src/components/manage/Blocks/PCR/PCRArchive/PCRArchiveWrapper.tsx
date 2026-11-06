import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PCRArchive from './PCRArchive'
import { SubmissionStatus } from '../PCRSubmission/EditHelperComponents'
import {
  ArchiveVersionsList,
  LegacyPCRIcon,
} from './PCRArchiveTabs/ArchiveHelperComponents'
import { useGetArchivePCR } from '../hooks/useGetArchivePCR'

import { useParams } from 'wouter'

const PCRArchiveWrapper = () => {
  const { archive_id } = useParams<Record<string, string>>()
  const pcr = useGetArchivePCR(archive_id)

  const [showVersionsMenu, setShowVersionsMenu] = useState(false)

  const loading = pcr.loading || !pcr.loaded

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && !!pcr.data && (
        <>
          <HeaderTitle>
            <div className="align-center flex flex-wrap justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex flex-row flex-wrap gap-2">
                  <RedirectBackButton />
                  <div className="mb-3 flex gap-2 text-lg uppercase tracking-[0.05em] text-[#4D4D4D]">
                    <span>/</span>
                    <span>View PCR</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <PageHeading>
                    <span className="font-medium text-[#4D4D4D]">
                      View PCR:{' '}
                    </span>
                    <span>{pcr.data.umbrella_code ?? 'N/A'}</span>
                  </PageHeading>
                  <ArchiveVersionsList
                    pcr={pcr.data}
                    {...{ showVersionsMenu, setShowVersionsMenu }}
                  />
                </div>
              </div>
              <div className="ml-auto mt-auto">
                <CancelLinkButton title="Cancel" href="/pcr" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {SubmissionStatus(pcr.data.status)}
              <LegacyPCRIcon size="large" className="mt-4" />
            </div>
          </HeaderTitle>
          <PCRArchive pcr={pcr.data} />
        </>
      )}
    </>
  )
}

export default PCRArchiveWrapper
