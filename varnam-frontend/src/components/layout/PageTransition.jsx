import { useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

export default function PageTransition({ children }) {
  const el = useRef(null)
  const { key } = useLocation()

  // Scroll to top on every page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [key])

  useGSAP(() => {
    gsap.fromTo(
      el.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', clearProps: 'all' }
    )
  }, { dependencies: [key], scope: el })

  return <div ref={el}>{children}</div>
}
