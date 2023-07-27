function isSlowConnection(effectiveType) {
  return (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g'
  )
}

function setSlowConnection() {
  // Get the network information
  if ('connection' in navigator) {
    const effectiveType = navigator.connection.effectiveType

    // Check if the connection is slow
    const isSlow = isSlowConnection(effectiveType)

    // Use the 'isSlow' variable to determine if the user's network is slow
    if (isSlow) {
      // Network is slow, you may choose to handle this situation accordingly
      // For example, reduce the complexity of animations or load lighter resources
      document.documentElement.setAttribute('data-connection', 'slow')
    } else if (effectiveType) {
      document.documentElement.setAttribute('data-connection', effectiveType)
    }
  }
}

setSlowConnection()
