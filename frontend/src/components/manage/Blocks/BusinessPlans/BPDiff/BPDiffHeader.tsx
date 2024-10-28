import cx from 'classnames'

import { useStore } from '@ors/store'

import BPHeaderView from '../BPHeaderView'

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

const BPDiffHeader = () => {
  const { currentVersion, previousVersion } = useStore(
    (state) => state.bp_diff_versions,
  )

  return (
    <div>
      <div className="mb-4 flex min-h-[40px] flex-wrap gap-x-2">
        <BPHeaderView
          actions={<></>}
          titlePrefix={<span className="text-4xl">Comparing: </span>}
          viewType="diff"
          tag={
            <div className="flex items-center self-baseline font-medium uppercase leading-none">
              <VersionTag isCurrentVersion={true} version={currentVersion} />
              <span className="mx-2">VS.</span>
              <VersionTag isCurrentVersion={false} version={previousVersion} />
            </div>
          }
        />
      </div>
    </div>
  )
}

export default BPDiffHeader
