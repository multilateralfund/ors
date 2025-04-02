import { useEffect, useMemo, useRef, useState } from 'react'

import { useStore } from '@ors/store'
import { useLocation } from 'wouter'

import cx from 'classnames'

import Cookies from 'js-cookie'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const images = [
  { name: '/images/mountains_mobile.jpg', classname: 'leftPosImg' },
  { name: '/images/river_mobile.jpg', classname: 'coverImg' },
  { name: '/images/corals_mobile.jpg', classname: 'coverImg' },
  { name: '/images/cave_mobile.jpg', classname: 'leftPosImg' },
  { name: '/images/mountains.jpg', classname: 'coverImg' },
  { name: '/images/river.jpg', classname: 'respLeftPostImg' },
  { name: '/images/corals.jpg', classname: 'coverImg' },
  { name: '/images/canyon.jpg', classname: 'leftBottomPosImg' },
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
      Cookies.set('recentSlides', JSON.stringify([...usedSlides, nextSlide]))
      setCurrentSlide(nextSlide)
    }
  }, [isMobile])

  const getNextSlide = (currentSlide: number) => {
    const validSlides = isMobile
      ? [...Array(4)].map((_, i) => i)
      : [...Array(4)].map((_, i) => i + 4)

    const filteredSlides = validSlides.filter(
      (slide) => slide != currentSlide && !usedSlides.includes(slide),
    )
    return filteredSlides.length > 0
      ? filteredSlides[Math.floor(Math.random() * filteredSlides.length)]
      : validSlides[Math.floor(Math.random() * validSlides.length)]
  }

  const crtSlide = Cookies.get('slide')
  const recentSlides = Cookies.get('recentSlides')

  const usedSlides = useMemo(() => {
    const parsedSlides = recentSlides ? JSON.parse(recentSlides) : []

    return parsedSlides.length === 4 ? [] : parsedSlides
  }, [recentSlides])

  const initialSlide = crtSlide
    ? getNextSlide(parseInt(crtSlide))
    : isMobile
      ? Math.floor(Math.random() * 4)
      : Math.floor(Math.random() * 4) + 4

  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (isFirstRenderRef.current || (user.data && pathname.includes('login')))
      return

    isFirstRenderRef.current = true
    Cookies.set('slide', initialSlide.toString())
    Cookies.set('recentSlides', JSON.stringify([...usedSlides, initialSlide]))
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
      const promises = images.map(({ name }) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.src = name
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
          Cookies.set(
            'recentSlides',
            JSON.stringify([...usedSlides, nextSlide]),
          )
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
          {images.map(({ name, classname }) => (
            <div key={name} className="h-screen">
              <img
                src={name}
                className={cx(
                  'h-screen w-full min-w-full max-w-none',
                  classname,
                )}
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
