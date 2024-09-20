import React, { useMemo } from 'react'

import cx from 'classnames'

import { useGetBPVersions } from '../BP/useGetBPVersions'
import { RedirectToBpList } from '../RedirectToBpList'
import { BPDiffHeaderInterface } from '../types'

const VersionTag = ({
  isCurrentVersion,
  version,
}: {
  isCurrentVersion: boolean
  version: number
}) => {
  return (
    <span
      className={cx(
        'rounded border border-solid border-transparent px-1.5 py-1',
        { 'bg-primary text-white': isCurrentVersion },
        { 'bg-gray-200 text-primary': !isCurrentVersion },
      )}
    >
      Version {version || '-'}
    </span>
  )
}

const BPDiffHeader = (props: BPDiffHeaderInterface) => {
  const { agency_id, pathParams, year_end, year_start } = props
  const { agency, period, version } = pathParams

  const bpVersions = useGetBPVersions({
    ...{ agency_id, year_end, year_start },
  })

  const { results = [] } = bpVersions

  const currentVersionObject = results.find(
    (vers) => vers.version === parseInt(version),
  )

  const currentVersion = useMemo(
    () => currentVersionObject?.version || null,
    [currentVersionObject],
  )

  const previousVersion = useMemo(() => {
    const currentVersionIndex = results.indexOf(currentVersionObject)
    const previousVersionObject = results[currentVersionIndex + 1]

    return previousVersionObject?.version || null
  }, [currentVersionObject, results])

  return (
    <div>
      <RedirectToBpList currentYearRange={period} />
      <div className="mb-4 flex min-h-[40px] flex-wrap gap-x-2">
        <h1 className="m-0 text-5xl font-normal leading-normal">Comparing:</h1>
        <h1 className="m-0 text-5xl leading-normal">
          {agency} {period}
        </h1>
        <div className="flex items-center self-baseline font-medium uppercase leading-none">
          <VersionTag isCurrentVersion={true} version={currentVersion} />
          <span className="mx-2">VS.</span>
          <VersionTag isCurrentVersion={false} version={previousVersion} />
        </div>
      </div>
    </div>
  )
}

export default BPDiffHeader
