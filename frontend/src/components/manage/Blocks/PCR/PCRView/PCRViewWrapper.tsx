import { useContext, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { SubmissionStatus } from '../PCRSubmission/EditHelperComponents'
import { VersionsList } from './PCRViewTabs/ViewHelperComponents'
import WorkflowButtons from '../PCRWorkflow/WorkflowButtons'
import PCRView from './PCRView'

import { useParams } from 'wouter'

const PCRViewWrapper = () => {
  const { pcr_id, project_id } = useParams<Record<string, string>>()
  const { pcr, pcrMetaproject } = useContext(PCRDataContext)

  const [showVersionsMenu, setShowVersionsMenu] = useState(false)

  const loading = pcr.loading || pcrMetaproject.loading || !pcr.loaded

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
                    <span>{pcrMetaproject?.data?.umbrella_code}</span>
                  </PageHeading>
                  <VersionsList
                    {...{ showVersionsMenu, setShowVersionsMenu }}
                  />
                </div>
              </div>
              <div className="ml-auto mt-auto flex flex-wrap items-center justify-end gap-2.5">
                <CancelLinkButton title="Cancel" href="/pcr" />
                {!pcr.data.latest_pcr_id && (
                  <>
                    {pcr.data.status !== 'Final' && (
                      <Link
                        className="border border-solid border-secondary px-4 py-2 shadow-none hover:border-primary hover:text-mlfs-hlYellow"
                        href={`/pcr/${project_id}/${pcr_id}/edit`}
                        variant="contained"
                        color="secondary"
                        size="large"
                        button
                      >
                        Edit
                      </Link>
                    )}
                    <WorkflowButtons />
                  </>
                )}
              </div>
            </div>
            {SubmissionStatus(pcr.data.status)}
          </HeaderTitle>
          <PCRView />
        </>
      )}
    </>
  )
}

export default PCRViewWrapper
