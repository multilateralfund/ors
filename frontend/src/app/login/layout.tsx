import { useEffect, useRef, useState } from 'react'

import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const images = [
  '/images/blue.jpg',
  '/images/green.jpg',
  '/images/orange.jpg',
  '/images/red.jpg',
]

const settings = {
  infinite: true,
  speed: 1000,
  slidesToShow: 1,
  slidesToScroll: 1,
  useTransform: false,
  accessibility: false,
  swipe: false,
  adaptiveHeight: true,
  easing: 'ease-in-out',
  touchMove: false,
  fade: true,
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sliderRef = useRef<any>(null)

  const [loaded, setLoaded] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const preloadImages = async () => {
      const promises = images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.src = src
          img.onload = resolve
        })
      })
      await Promise.all(promises)
      setLoaded(true)
    }
    preloadImages()
  }, [])

  useEffect(() => {
    if (loaded) {
      const interval = setInterval(() => {
        if (sliderRef.current) {
          const nextSlide = (currentSlide + 1) % images.length
          sliderRef.current.slickGoTo(nextSlide)
          setCurrentSlide(nextSlide)
        }
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [currentSlide, loaded])

  if (!loaded) return null

  return (
    <div className="max-w-screen m-auto h-screen w-screen overflow-hidden">
      <Slider {...settings} ref={sliderRef}>
        {images.map((image) => (
          <div key={image}>
            <div
              className="h-screen w-screen bg-cover"
              style={{ backgroundImage: `url(${image})` }}
            >
              {children}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  )
}
