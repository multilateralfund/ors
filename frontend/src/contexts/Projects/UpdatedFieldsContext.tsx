import { createContext, ReactNode, useContext, useState } from 'react'

type UpdatedFieldsContextType = {
  updatedFields: Set<string>
  addUpdatedField: (field: string) => void
  clearUpdatedFields: () => void
}

const UpdatedFieldsContext = createContext<
  UpdatedFieldsContextType | undefined
>(undefined)

export const useUpdatedFields = () => {
  const context = useContext(UpdatedFieldsContext)
  if (!context) {
    throw new Error('useUpdatedFields must be used within its provider')
  }
  return context
}

export const UpdatedFieldsProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set())

  const addUpdatedField = (field: string) => {
    setUpdatedFields((prev) => new Set(prev).add(field))
  }

  const clearUpdatedFields = () => setUpdatedFields(new Set())

  return (
    <UpdatedFieldsContext.Provider
      value={{ updatedFields, addUpdatedField, clearUpdatedFields }}
    >
      {children}
    </UpdatedFieldsContext.Provider>
  )
}
