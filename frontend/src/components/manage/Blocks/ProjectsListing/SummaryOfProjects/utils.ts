// Filter out parameters with falsy values to reduce encoded size.
export const filterByValue = (obj: Record<string, any>) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value))
}
