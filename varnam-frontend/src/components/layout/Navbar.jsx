import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { categoryAPI } from '../../services/api'

gsap.registerPlugin(ScrollTrigger)

function VarnamLogo({ className = '' }) {
  return (
    <svg
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Varnam Naturals"
    >
      <path d="M8 32 C8 20 16 10 28 8 C26 20 18 28 8 32Z" fill="#2D6A4F" />
      <path d="M28 8 C28 20 22 30 12 34 C16 26 22 18 28 8Z" fill="#52B788" opacity="0.7" />
      <line x1="14" y1="34" x2="26" y2="10" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.4" />
      <text x="36" y="25" fontFamily="'Playfair Display', Georgia, serif" fontSize="19" fontWeight="700" fill="#2D6A4F" letterSpacing="-0.4">varnam</text>
      <text x="37" y="35" fontFamily="'DM Sans', system-ui, sans-serif" fontSize="7" fontWeight="400" fill="#C8893A" letterSpacing="3.2">NATURALS</text>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ChevronDown({ className = '' }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Categories mega-dropdown ────────────────────────────────────────────────
function CategoriesDropdown({ categories }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const panelRef = useRef(null)
  const timeoutRef = useRef(null)

  const show = () => {
    clearTimeout(timeoutRef.current)
    setOpen(true)
  }
  const hide = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120)
  }

  useGSAP(() => {
    if (!panelRef.current) return
    if (open) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, y: -8, display: 'block' },
        { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' }
      )
      gsap.fromTo(
        panelRef.current.querySelectorAll('.cat-item'),
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.2, ease: 'power2.out', delay: 0.05 }
      )
    } else {
      gsap.to(panelRef.current, {
        opacity: 0, y: -6, duration: 0.16, ease: 'power2.in',
        onComplete: () => { if (panelRef.current) gsap.set(panelRef.current, { display: 'none' }) }
      })
    }
  }, { dependencies: [open] })

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-body tracking-wide transition-colors duration-200 group
          ${open ? 'text-brand-green' : 'text-stone-600 hover:text-brand-green'}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(v => !v)}
      >
        Categories
        <ChevronDown className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        <span className={`absolute bottom-0.5 left-3.5 right-3.5 h-[1.5px] bg-brand-green rounded-full transition-all duration-300 origin-left
          ${open ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-40'}`}
        />
      </button>

      {/* Dropdown panel */}
      <div
        ref={panelRef}
        style={{ display: 'none' }}
        className="absolute left-0 top-full mt-2 z-50"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {/* Arrow */}
        <div className="relative ml-6 w-3 h-1.5 overflow-visible">
          <div className="absolute -top-0 left-0 w-3 h-3 bg-white border-l border-t border-brand-green/10 rotate-45 shadow-none" />
        </div>

        <div className="mt-0.5 bg-white/96 backdrop-blur-md rounded-2xl shadow-[0_8px_40px_rgba(45,106,79,0.14)] border border-brand-green/8 py-2 min-w-[200px] bg-white">
          {/* View all link */}
          <Link
            to="/shop"
            className="cat-item flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-body text-brand-green font-medium hover:bg-brand-green/8 transition-colors duration-150 rounded-xl mx-1.5"
            onClick={() => setOpen(false)}
          >
            <span className="w-5 h-5 rounded-full bg-brand-green/10 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            Shop All
          </Link>

          {categories.length > 0 && (
            <div className="my-1.5 mx-3 border-t border-stone-100" />
          )}

          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat._id}
              to={`/category/${cat.slug}`}
              className="cat-item flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-body text-stone-700 hover:text-brand-green hover:bg-brand-green/6 transition-colors duration-150 rounded-xl mx-1.5"
              onClick={() => setOpen(false)}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-amber/60 flex-shrink-0" />
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Navbar ─────────────────────────────────────────────────────────────
export default function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore()
  const itemCount             = useCartStore((s) => s.itemCount())
  const freeShippingThreshold = useCartStore((s) => s.freeShippingThreshold)
  const fetchSettings         = useCartStore((s) => s.fetchSettings)
  const [categories, setCategories] = useState([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [announcerVisible, setAnnouncerVisible] = useState(true)

  const navRef = useRef(null)
  const drawerRef = useRef(null)
  const overlayRef = useRef(null)
  const badgeRef = useRef(null)
  const prevCountRef = useRef(itemCount)
  const userMenuRef = useRef(null)

  useEffect(() => {
    categoryAPI.getAll()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {})
    // Fetch live shipping settings so the announcement bar always
    // shows the real threshold, not a hardcoded fallback.
    fetchSettings()
  }, [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    toast.success('See you again!')
    navigate('/')
  }

  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useGSAP(() => {
    if (!navRef.current) return
    gsap.to(navRef.current, {
      backgroundColor: scrolled ? 'rgba(253,246,236,0.97)' : 'rgba(253,246,236,1)',
      backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
      boxShadow: scrolled ? '0 1px 0 rgba(45,106,79,0.08), 0 4px 24px rgba(45,106,79,0.06)' : '0 1px 0 rgba(45,106,79,0.06)',
      duration: 0.4,
      ease: 'power2.out',
    })
  }, { dependencies: [scrolled], scope: navRef })

  useGSAP(() => {
    if (itemCount > prevCountRef.current && badgeRef.current) {
      gsap.fromTo(badgeRef.current,
        { scale: 1.9, rotate: -15 },
        { scale: 1, rotate: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)' }
      )
    }
    prevCountRef.current = itemCount
  }, { dependencies: [itemCount] })

  useGSAP(() => {
    if (!drawerRef.current || !overlayRef.current) return
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      gsap.set(drawerRef.current, { x: '100%', display: 'flex' })
      gsap.set(overlayRef.current, { display: 'block', opacity: 0 })
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'none' })
      gsap.to(drawerRef.current, { x: '0%', duration: 0.42, ease: 'power4.out' })
      gsap.fromTo(
        drawerRef.current.querySelectorAll('.drawer-item'),
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.05, delay: 0.18, duration: 0.38, ease: 'power3.out' }
      )
    } else {
      document.body.style.overflow = ''
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.22, ease: 'none' })
      gsap.to(drawerRef.current, {
        x: '100%', duration: 0.35, ease: 'power3.in',
        onComplete: () => {
          if (drawerRef.current) gsap.set(drawerRef.current, { display: 'none' })
          if (overlayRef.current) gsap.set(overlayRef.current, { display: 'none' })
        },
      })
    }
  }, { dependencies: [mobileOpen] })

  useEffect(() => () => { document.body.style.overflow = '' }, [])

  return (
    <>
      {/* Top announcement bar */}
      {announcerVisible && (
        <div className="relative bg-brand-green text-brand-cream text-xs font-body tracking-wide py-2 text-center">
          <span className="opacity-80">✦</span>
          <span className="mx-2">Free shipping on orders above ₹{freeShippingThreshold}</span>
          <span className="opacity-80">✦</span>
          <button
            onClick={() => setAnnouncerVisible(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      )}

      <header
        ref={navRef}
        className="sticky top-0 z-50"
        style={{ backgroundColor: 'rgba(253,246,236,1)', boxShadow: '0 1px 0 rgba(45,106,79,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-6">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0" aria-label="Varnam Naturals home">
              <VarnamLogo className="h-9 w-auto lg:h-12" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0 flex-1">
              <DesktopLink to="/shop">Shop</DesktopLink>
              <CategoriesDropdown categories={categories} />
              <DesktopLink to="/track-order">Track Order</DesktopLink>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 ml-auto">

              {/* Search */}
              <Link
                to="/search"
                className="flex items-center justify-center w-10 h-10 rounded-full text-stone-500 hover:text-brand-green hover:bg-brand-green/8 transition-all duration-200"
                aria-label="Search"
              >
                <SearchIcon />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full text-stone-500 hover:text-brand-green hover:bg-brand-green/8 transition-all duration-200"
                aria-label={`Cart — ${itemCount} items`}
              >
                <BagIcon />
                {itemCount > 0 && (
                  <span
                    ref={badgeRef}
                    className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-brand-amber text-white text-[9px] font-bold rounded-full leading-none"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User / Auth */}
              {isAuthenticated ? (
                <div ref={userMenuRef} className="relative hidden sm:block">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 h-10 px-3 rounded-full text-stone-600 hover:text-brand-green hover:bg-brand-green/8 transition-all duration-200 text-sm font-body"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="w-6 h-6 rounded-full bg-brand-green/12 flex items-center justify-center">
                      <UserIcon />
                    </span>
                    <span className="hidden md:block max-w-[72px] truncate text-[13px]">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2.5 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_40px_rgba(45,106,79,0.14)] border border-brand-green/8 py-1.5 z-50 origin-top-right animate-[scaleIn_0.15s_ease]">
                      {isAdmin && (
                        <DropdownItem to="/admin" onClick={() => setUserMenuOpen(false)} accent="amber">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                          Admin Panel
                        </DropdownItem>
                      )}
                      <DropdownItem to="/orders" onClick={() => setUserMenuOpen(false)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        My Orders
                      </DropdownItem>
                      <DropdownItem to="/account" onClick={() => setUserMenuOpen(false)}>
                        <UserIcon />
                        My Account
                      </DropdownItem>
                      <div className="my-1 mx-3 border-t border-stone-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-body text-red-500 hover:bg-red-50/80 transition-colors duration-150 rounded-xl mx-0"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 ml-1">
                  <Link to="/login" className="text-[13px] font-body text-stone-600 hover:text-brand-green px-3 py-2 rounded-full hover:bg-brand-green/8 transition-all duration-200">
                    Login
                  </Link>
                  <Link to="/register" className="text-[13px] font-body bg-brand-green text-brand-cream px-4 py-2 rounded-full hover:bg-brand-green-dark transition-all duration-200">
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                className="lg:hidden flex flex-col gap-[5px] items-center justify-center w-10 h-10 rounded-full hover:bg-brand-green/8 transition-all duration-200 ml-1"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <span className="w-5 h-[1.5px] bg-stone-600 rounded-full" />
                <span className="w-3.5 h-[1.5px] bg-stone-600 rounded-full self-end mr-0.5" />
                <span className="w-5 h-[1.5px] bg-stone-600 rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
        style={{ display: 'none' }}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 bottom-0 z-50 w-[min(300px,88vw)] bg-brand-cream flex-col shadow-[0_0_60px_rgba(0,0,0,0.15)] overflow-y-auto"
        style={{ display: 'none' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer top */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/50">
          <Link to="/" onClick={() => setMobileOpen(false)}>
            <VarnamLogo className="h-8 w-auto" />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 transition-colors"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <nav className="flex flex-col px-3 py-5 gap-0.5">
          <MobileLink to="/shop" onClick={() => setMobileOpen(false)}>Shop All</MobileLink>
          {categories.length > 0 && (
            <p className="px-3 pt-4 pb-1.5 text-[9px] font-body tracking-[0.2em] uppercase text-stone-400">Categories</p>
          )}
          {categories.slice(0, 5).map((cat) => (
            <MobileLink key={cat._id} to={`/category/${cat.slug}`} onClick={() => setMobileOpen(false)}>
              {cat.name}
            </MobileLink>
          ))}
          <div className="my-3 border-t border-stone-200/60" />
          <MobileLink to="/track-order" onClick={() => setMobileOpen(false)}>Track Order</MobileLink>
          <MobileLink to="/search" onClick={() => setMobileOpen(false)}>Search</MobileLink>
          <div className="my-3 border-t border-stone-200/60" />
          {isAuthenticated ? (
            <>
              <p className="px-3 pb-1.5 text-[9px] font-body tracking-[0.2em] uppercase text-stone-400">Account</p>
              {isAdmin && <MobileLink to="/admin" onClick={() => setMobileOpen(false)}>Admin Panel</MobileLink>}
              <MobileLink to="/orders" onClick={() => setMobileOpen(false)}>My Orders</MobileLink>
              <MobileLink to="/account" onClick={() => setMobileOpen(false)}>My Account</MobileLink>
              <button
                onClick={handleLogout}
                className="drawer-item flex items-center gap-3 w-full px-3 py-3 rounded-xl text-[13px] font-body text-red-500 hover:bg-red-50 transition-colors text-left mt-1"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 px-1 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="drawer-item flex items-center justify-center py-3 rounded-xl border border-brand-green text-brand-green text-sm font-body hover:bg-brand-green hover:text-brand-cream transition-all duration-200">
                Login
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="drawer-item flex items-center justify-center py-3 rounded-xl bg-brand-green text-brand-cream text-sm font-body hover:bg-brand-green-dark transition-all duration-200">
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Drawer footer */}
        <div className="mt-auto px-5 py-6 border-t border-stone-200/50">
          <p className="text-[10px] font-body text-stone-400 tracking-wide">Pure · Cold Pressed · Natural</p>
        </div>
      </div>
    </>
  )
}

function DesktopLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative px-3.5 py-2 text-[13px] font-body tracking-wide transition-colors duration-200 group
        ${isActive ? 'text-brand-green' : 'text-stone-600 hover:text-brand-green'}`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          <span className={`absolute bottom-0.5 left-3.5 right-3.5 h-[1.5px] bg-brand-green rounded-full transition-all duration-300 origin-left
            ${isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-40'}`}
          />
        </>
      )}
    </NavLink>
  )
}

function DropdownItem({ to, onClick, children, accent }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-body transition-colors duration-150 rounded-xl
        ${accent === 'amber' ? 'text-amber-700 hover:bg-amber-50/80' : 'text-stone-700 hover:bg-stone-50'}`}
    >
      {children}
    </Link>
  )
}

function MobileLink({ to, onClick, children }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `drawer-item flex items-center px-3 py-3 rounded-xl text-[13px] font-body transition-colors duration-150
        ${isActive ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-stone-700 hover:bg-stone-100/80'}`
      }
    >
      {children}
    </NavLink>
  )
}