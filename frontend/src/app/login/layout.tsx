import { useEffect, useRef, useState } from 'react'

import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const images = [
  '/images/mountains_mobile.jpg',
  '/images/river_mobile.jpg',
  '/images/corals_mobile.jpg',
  '/images/cave_mobile.jpg',
  '/images/mountains.jpg',
  '/images/river.jpg',
  '/images/corals.jpg',
  '/images/cave.jpg',
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
      const isMobile = window.innerWidth < 768

      const interval = setInterval(() => {
        if (sliderRef.current) {
          const validSlides = isMobile
            ? [...Array(4)].map((_, i) => i)
            : [...Array(4)].map((_, i) => i + 4)

          const realCurrentSlide = !validSlides.includes(currentSlide)
            ? isMobile
              ? currentSlide - 4
              : currentSlide + 4
            : currentSlide

          const nextIndex =
            (validSlides.indexOf(realCurrentSlide) + 1) % validSlides.length
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
