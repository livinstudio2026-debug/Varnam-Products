// src/pages/Search.jsx — Step 13

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { productAPI, categoryAPI } from '../services/api'
import ProductCard from '../components/ui/ProductCard'
import PageTransition from '../components/layout/PageTransition'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

/* ── Skeleton card ─────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', background: '#fff', border: '1px solid #F0EBE1' }}>
      <div className="skeleton" style={{ aspectRatio: '1/1' }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div className="skeleton" style={{ height: 12, width: '75%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '50%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 32, borderRadius: 10, marginTop: 4 }} />
      </div>
    </div>
  )
}

/* ── Suggestion chip ───────────────────────────────────────────────────────── */
function Chip({ label, onClick, icon }) {
  const ref = useRef(null)
  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => gsap.to(ref.current, { scale: 1.04, duration: 0.18, ease: 'power2.out' })}
      onMouseLeave={() => gsap.to(ref.current, { scale: 1, duration: 0.18, ease: 'power2.out' })}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 16px', borderRadius: 99,
        background: '#fff', border: '1px solid #E8E0D0',
        fontFamily: 'var(--font-body)', fontSize: 13, color: '#5C5548',
        cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'border-color 0.15s, color 0.15s',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.color = '#2D6A4F' }}
      onBlur={e  => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#5C5548' }}
    >
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      {label}
    </button>
  )
}

/* ── Empty / no-results state ─────────────────────────────────────────────── */
function EmptyState({ query, categories, onSuggest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px 40px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(45,106,79,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: '#A89F8C' }}>
        <SearchIcon />
      </div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#26221C', margin: '0 0 8px' }}>
        {query ? `No results for "${query}"` : 'Search our products'}
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', color: '#A89F8C', fontSize: 14, maxWidth: 340, margin: '0 0 28px', lineHeight: 1.6 }}>
        {query
          ? 'Try different keywords, or explore by category below.'
          : 'Type a product name, ingredient, or category to get started.'}
      </p>

      {/* Category suggestions */}
      {categories.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            Browse by category
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {categories.map(cat => (
              <Link key={cat._id} to={`/category/${cat.slug}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, background: 'rgba(45,106,79,0.07)', border: '1px solid rgba(45,106,79,0.12)', fontFamily: 'var(--font-body)', fontSize: 13, color: '#2D6A4F', textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,106,79,0.13)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(45,106,79,0.07)'}
              >
                {cat.name} <ArrowRight />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular search suggestions */}
      <div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          Popular searches
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {['Coconut oil', 'Sesame oil', 'Cold pressed', 'Hair oil', 'Organic'].map(term => (
            <Chip key={term} label={term} onClick={() => onSuggest(term)} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main Search page ─────────────────────────────────────────────────────── */
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''

  const [inputValue, setInputValue] = useState(initialQ)
  const [query, setQuery]           = useState(initialQ)
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(false)
  const [searched, setSearched]     = useState(!!initialQ)

  const inputRef   = useRef(null)
  const gridRef    = useRef(null)
  const debounceRef = useRef(null)

  /* ── Fetch categories once ─────────────────────────────────────────────── */
  useEffect(() => {
    categoryAPI.getAll()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {})
  }, [])

  /* ── Auto-focus input on mount ─────────────────────────────────────────── */
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  /* ── Core search function ──────────────────────────────────────────────── */
  const doSearch = useCallback(async (q) => {
    const trimmed = q.trim()
    setQuery(trimmed)

    if (!trimmed) {
      setProducts([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    // Sync to URL so the link is shareable / bookmarkable
    setSearchParams({ q: trimmed }, { replace: true })

    try {
      const { data } = await productAPI.search(trimmed)
      setProducts(data.data || [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [setSearchParams])

  /* ── Debounced input handler (400 ms) ─────────────────────────────────── */
  const handleInput = (e) => {
    const val = e.target.value
    setInputValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  /* ── Clear ─────────────────────────────────────────────────────────────── */
  const handleClear = () => {
    setInputValue('')
    setQuery('')
    setProducts([])
    setSearched(false)
    setSearchParams({}, { replace: true })
    inputRef.current?.focus()
  }

  /* ── Suggestion chip click ─────────────────────────────────────────────── */
  const handleSuggest = (term) => {
    setInputValue(term)
    doSearch(term)
  }

  /* ── Submit (Enter / button) ───────────────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    doSearch(inputValue)
  }

  /* ── GSAP stagger on new results ───────────────────────────────────────── */
  useGSAP(() => {
    if (loading || !gridRef.current) return
    const cards = gridRef.current.querySelectorAll('.result-card')
    if (!cards.length) return
    gsap.fromTo(cards,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.045, duration: 0.4, ease: 'power3.out', clearProps: 'all' }
    )
  }, { dependencies: [loading, products], scope: gridRef })

  /* ── Cleanup debounce ──────────────────────────────────────────────────── */
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const hasResults = products.length > 0
  const showEmpty  = searched && !loading && !hasResults

  return (
    <PageTransition>
      <div style={{ minHeight: '80vh', paddingBottom: 64 }}>

        {/* ── Search bar hero ─────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
          padding: '44px 0 40px',
        }}>
          <div className="container-main">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(253,246,236,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Search
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 'clamp(1.5rem,3vw,2.2rem)', margin: '0 0 24px', lineHeight: 1.2 }}>
              Find what you're looking for
            </h1>

            {/* Input */}
            <form onSubmit={handleSubmit} style={{ position: 'relative', maxWidth: 600 }}>
              <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: query ? '#2D6A4F' : '#A89F8C', pointerEvents: 'none', display: 'flex' }}>
                <SearchIcon />
              </div>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={handleInput}
                placeholder="Search products, ingredients…"
                autoComplete="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 52px',
                  borderRadius: 16,
                  border: '2px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.96)',
                  fontFamily: 'var(--font-body)', fontSize: 15, color: '#26221C',
                  outline: 'none', boxSizing: 'border-box',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#52B788' }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
              />
              {/* Clear button */}
              {inputValue && (
                <button type="button" onClick={handleClear}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    width: 28, height: 28, borderRadius: '50%', border: 'none',
                    background: '#E8E0D0', color: '#5C5548', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <XIcon />
                </button>
              )}
            </form>

            {/* Live result count */}
            {searched && !loading && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(253,246,236,0.6)', margin: '12px 0 0' }}>
                {hasResults
                  ? `${products.length} result${products.length !== 1 ? 's' : ''} for "${query}"`
                  : `No results for "${query}"`}
              </p>
            )}
          </div>
        </div>

        {/* ── Results / empty state ───────────────────────────────────── */}
        <div className="container-main" style={{ paddingTop: 36 }}>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }} className="search-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Results grid */}
          {!loading && hasResults && (
            <>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>
                  Showing <strong style={{ color: '#26221C' }}>{products.length}</strong> result{products.length !== 1 ? 's' : ''} for <strong style={{ color: '#26221C' }}>"{query}"</strong>
                </p>
                <Link to="/shop"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#2D6A4F', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Browse all products <ArrowRight />
                </Link>
              </div>

              <div ref={gridRef}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}
                className="search-grid">
                {products.map(p => (
                  <div key={p._id} className="result-card">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty / idle state */}
          {!loading && (showEmpty || !searched) && (
            <EmptyState
              query={showEmpty ? query : ''}
              categories={categories}
              onSuggest={handleSuggest}
            />
          )}
        </div>
      </div>

      {/* Responsive grid */}
      <style>{`
        @media (max-width: 1023px) { .search-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 767px)  { .search-grid { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; } }
      `}</style>
    </PageTransition>
  )
}