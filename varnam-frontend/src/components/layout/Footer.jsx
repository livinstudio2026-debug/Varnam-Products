import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Navigates to the route AND scrolls to top — fixes footer links landing mid-page
function TopLink({ to, className, children }) {
  const navigate = useNavigate()
  const handleClick = (e) => {
    e.preventDefault()
    navigate(to)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  return <a href={to} onClick={handleClick} className={className}>{children}</a>
}

function LeafMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 opacity-60">
      <path d="M6 28 C6 16 14 6 26 4 C24 16 16 24 6 28Z" fill="#52B788" />
      <path d="M26 4 C26 16 20 26 10 30 C14 22 20 14 26 4Z" fill="#95D5B2" opacity="0.6" />
    </svg>
  )
}

const SHOP_LINKS = [
  { label: 'All Products', to: '/shop' },
  { label: 'New Arrivals', to: '/shop?sort=newest' },
  { label: 'Track Your Order', to: '/track-order' },
  { label: 'Search', to: '/search' },
]

const ACCOUNT_LINKS = [
  { label: 'Login', to: '/login' },
  { label: 'Create Account', to: '/register' },
  { label: 'My Orders', to: '/orders' },
  { label: 'My Account', to: '/account' },
]

export default function Footer() {
  const footerRef = useRef(null)

  useGSAP(() => {
    const items = footerRef.current?.querySelectorAll('.footer-reveal')
    if (!items?.length) return

    // Set visible by default — prevents elements staying hidden if trigger never fires
    gsap.set(items, { y: 0, opacity: 1 })

    const trigger = ScrollTrigger.create({
      trigger: footerRef.current,
      start: 'top 95%',
      once: true,
      onEnter: () => {
        gsap.fromTo(items,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.07, duration: 0.7, ease: 'power3.out' }
        )
      },
    })

    return () => trigger.kill()
  }, { scope: footerRef })

  return (
    <footer ref={footerRef} className="bg-neutral-800 text-neutral-300 mt-auto overflow-hidden relative">
      {/* Subtle organic texture top border */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand-green/30 to-transparent" />

      {/* Decorative leaf — large background */}
      <div className="absolute top-0 right-0 w-72 h-72 opacity-[0.03] pointer-events-none translate-x-12 -translate-y-8">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 180 C20 80 100 10 190 5 C180 100 110 165 20 180Z" fill="#52B788" />
        </svg>
      </div>

      <div className="container-main py-16 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-4 footer-reveal">
            <TopLink to="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <LeafMark />
              <div className="flex flex-col leading-none">
                <span className="font-heading text-xl text-white tracking-tight">varnam</span>
                <span className="text-[9px] font-body tracking-[0.22em] text-brand-amber uppercase mt-0.5">naturals</span>
              </div>
            </TopLink>
            <p className="text-sm font-body leading-relaxed text-neutral-400 max-w-[260px] mb-6">
              Pure, cold-pressed, and chemical-free. Rooted in tradition, crafted for modern living.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {['100% Natural', 'Cold Pressed', 'No Chemicals'].map((tag) => (
                <span key={tag} className="text-[10px] font-body tracking-wide px-2.5 py-1 rounded-full border border-neutral-700 text-neutral-500">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div className="lg:col-span-3 lg:col-start-6 footer-reveal">
            <h4 className="font-body font-semibold text-white text-[11px] tracking-[0.15em] uppercase mb-5">
              Shop
            </h4>
            <ul className="space-y-3">
              {SHOP_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <TopLink to={to} className="text-[13px] font-body text-neutral-400 hover:text-brand-amber-light transition-colors duration-150 flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2 h-[1px] bg-brand-amber transition-all duration-200 rounded-full" />
                    {label}
                  </TopLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="lg:col-span-2 footer-reveal">
            <h4 className="font-body font-semibold text-white text-[11px] tracking-[0.15em] uppercase mb-5">
              Account
            </h4>
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <TopLink to={to} className="text-[13px] font-body text-neutral-400 hover:text-brand-amber-light transition-colors duration-150 flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2 h-[1px] bg-brand-amber transition-all duration-200 rounded-full" />
                    {label}
                  </TopLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 footer-reveal">
            <h4 className="font-body font-semibold text-white text-[11px] tracking-[0.15em] uppercase mb-5">
              Get In Touch
            </h4>
            <ul className="space-y-3 text-[13px] font-body">
              <li>
                <a href="mailto:hello@varnamnaturals.com"
                  className="text-neutral-400 hover:text-brand-amber-light transition-colors duration-150 break-all">
                  hello@varnamnaturals.com
                </a>
              </li>
              <li>
                <a href="tel:+919999999999"
                  className="text-neutral-400 hover:text-brand-amber-light transition-colors duration-150">
                  +91 99999 99999
                </a>
              </li>
              <li className="text-neutral-600 text-[12px] pt-1 leading-relaxed">
                Monday – Saturday<br />10 AM – 6 PM IST
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-reveal mt-14 pt-6 border-t border-neutral-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] font-body text-neutral-600">
            © {new Date().getFullYear()} Varnam Naturals. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-body text-neutral-700 tracking-widest uppercase">Pure · Natural · Cold Pressed</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
