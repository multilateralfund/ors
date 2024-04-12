const SectionOverlay = ({ className = "", opacity = 70 }) => {
  return (
    <div
      className={`absolute inset-0 z-50 bg-gray-100 opacity-${opacity} ${className}`}
    ></div>
  )
}

export default SectionOverlay
