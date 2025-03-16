import { useEffect, useRef, useState } from 'react'

import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const images = [
  '/images/blue_mobile.jpg',
  '/images/green_mobile.jpg',
  '/images/orange_mobile.jpg',
  '/images/red_mobile.jpg',
  '/images/blue.jpg',
  '/images/green.jpg',
  '/images/orange.jpg',
  '/images/red.jpg',
]

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sliderRef = useRef<any>(null)

  const initialSlide = window.innerWidth < 768 ? 0 : 4
  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const [loaded, setLoaded] = useState(false)

  const settings = {
    infinite: true,
    speed: 1000,
    initialSlide: initialSlide,
    slidesToShow: 1,
    slidesToScroll: 1,
    useTransform: false,
    adaptiveHeight: true,
    easing: 'ease-in-out',
    fade: true,
  }

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
          const validSlides =
            window.innerWidth < 768
              ? [...Array(4)].map((_, i) => i)
              : [...Array(4)].map((_, i) => i + 4)

          const nextIndex =
            (validSlides.indexOf(currentSlide) + 1) % validSlides.length
          const nextSlide = validSlides[nextIndex]

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
            />
          </div>
        ))}
      </Slider>
      <div className="fixed left-1/2 top-[40%] w-[90%] -translate-x-1/2 -translate-y-1/2 transform md:top-1/2">
        {children}
      </div>
    </div>
  )
}
