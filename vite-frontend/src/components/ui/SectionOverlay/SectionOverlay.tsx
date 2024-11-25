const SectionOverlay = ({ className = "", opacity = 'opacity-70' }) => {
  return (
    <div
      className={`absolute inset-0 z-40 bg-gray-100 ${opacity} ${className}`}
    ></div>
  )
}

export default SectionOverlay
