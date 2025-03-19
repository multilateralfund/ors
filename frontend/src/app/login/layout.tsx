import { useEffect, useRef, useState } from 'react'

import { useStore } from '@ors/store'
import { useLocation } from 'wouter'

import Cookies from 'js-cookie'
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
  const isFirstRenderRef = useRef<boolean>(false)
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const user = useStore((state) => state.user)
  const [pathname] = useLocation()

  const getIsMobile = () => window.innerWidth < 768
  const [isMobile, setIsMobile] = useState(getIsMobile())

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current)
      }

      resizeTimerRef.current = setTimeout(() => {
        setIsMobile(getIsMobile())
      }, 500)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const nextSlide = getNextSlide(currentSlide)

    if (sliderRef.current) {
      sliderRef.current.slickGoTo(nextSlide)
      Cookies.set('slide', nextSlide.toString())
      setCurrentSlide(nextSlide)
    }
  }, [isMobile])

  const getNextSlide = (slide: number) => {
    const validSlides = isMobile
      ? [...Array(4)].map((_, i) => i)
      : [...Array(4)].map((_, i) => i + 4)

    const crtSlide = !validSlides.includes(slide)
      ? isMobile
        ? slide - 4
        : slide + 4
      : slide
    const nextSlideIndex =
      (validSlides.indexOf(crtSlide) + 1) % validSlides.length

    return validSlides[nextSlideIndex]
  }

  const crtSlide = Cookies.get('slide')
  const initialSlide = crtSlide
    ? getNextSlide(parseInt(crtSlide))
    : isMobile
      ? 0
      : 4

  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (isFirstRenderRef.current || (user.data && pathname.includes('login')))
      return

    isFirstRenderRef.current = true
    Cookies.set('slide', initialSlide.toString())
  }, [])

  const settings = {
    infinite: true,
    speed: 1000,
    initialSlide: currentSlide,
    slidesToShow: 1,
    slidesToScroll: 1,
    useTransform: false,
    adaptiveHeight: true,
    easing: 'ease-in-out',
    accessibility: false,
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
          const nextSlide = getNextSlide(currentSlide)

          sliderRef.current.slickGoTo(nextSlide)
          Cookies.set('slide', nextSlide.toString())
          setCurrentSlide(nextSlide)
        }
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [currentSlide, loaded])

  if (!loaded) return null

  return (
    <div className="max-w-screen m-auto h-screen w-screen overflow-hidden">
      {(!user.data || (user.data && !pathname.includes('login'))) && (
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
      )}
      <div className="fixed left-1/2 top-[40%] w-[90%] -translate-x-1/2 -translate-y-1/2 transform md:top-1/2">
        {children}
      </div>
    </div>
  )
}
