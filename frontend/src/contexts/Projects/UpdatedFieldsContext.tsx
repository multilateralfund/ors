import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

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

  const addUpdatedField = useCallback((field: string) => {
    setUpdatedFields((prev) => {
      if (prev.has(field)) {
        return prev
      }

      return new Set(prev).add(field)
    })
  }, [])

  const clearUpdatedFields = useCallback(() => {
    setUpdatedFields((prev) => (prev.size === 0 ? prev : new Set()))
  }, [])

  const value = useMemo(
    () => ({ updatedFields, addUpdatedField, clearUpdatedFields }),
    [updatedFields, addUpdatedField, clearUpdatedFields],
  )

  return (
    <UpdatedFieldsContext.Provider
      value={value}
    >
      {children}
    </UpdatedFieldsContext.Provider>
  )
}
