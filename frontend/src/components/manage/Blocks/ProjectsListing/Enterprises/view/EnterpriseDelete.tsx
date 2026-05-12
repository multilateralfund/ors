import { useState } from 'react'

import DeleteEnterpriseModal from '../listing/DeleteEnterpriseModal'
import { EnterpriseType } from '../../interfaces'

import { IoTrash } from 'react-icons/io5'

const EnterpriseDelete = ({ enterprise }: { enterprise: EnterpriseType }) => {
  const [showWarning, setShowWarning] = useState(false)

  return (
    <>
      <div
        className="flex cursor-pointer items-center justify-between gap-x-2 text-nowrap text-red-800"
        onClick={() => {
          setShowWarning(true)
        }}
      >
        <span>Delete enterprise</span>
        <IoTrash className="text-xl" />
      </div>
      {showWarning && (
        <DeleteEnterpriseModal
          mode="view"
          idToDelete={enterprise.id}
          {...{ showWarning, setShowWarning }}
        />
      )}
    </>
  )
}

export default EnterpriseDelete
