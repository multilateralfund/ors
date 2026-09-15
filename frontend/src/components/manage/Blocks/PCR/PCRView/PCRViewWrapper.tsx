import { useContext } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRView from './PCRView'
import { PCRResponse } from '../interfaces'
import useApi from '@ors/hooks/useApi'

import { useParams } from 'wouter'

const PCRViewWrapper = () => {
  const { pcr_id, project_id } = useParams<Record<string, string>>()
  const { pcrMetaproject } = useContext(PCRDataContext)

  const pcr = useApi<PCRResponse>({
    options: {
      triggerIf: !!pcr_id,
      withStoreCache: false,
    },
    path: pcr_id ? `api/project-completion-reports/${pcr_id}/` : '',
    reactivePath: true,
  })

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
                <RedirectBackButton />
                <PageHeading>
                  <span className="font-medium text-[#4D4D4D]">View PCR: </span>
                  <span>{pcrMetaproject?.data?.umbrella_code}</span>
                </PageHeading>
              </div>
              <div className="ml-auto mt-auto flex flex-wrap items-center justify-end gap-2.5">
                <CancelLinkButton title="Cancel" href="/pcr" />
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
              </div>
            </div>
          </HeaderTitle>
          <PCRView pcr={pcr.data} />
        </>
      )}
    </>
  )
}

export default PCRViewWrapper
