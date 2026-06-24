import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { toast } from 'react-hot-toast';

import ProductCard from '../components/ui/ProductCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import { productAPI, categoryAPI } from '../services/api';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
  </svg>
);
const ChevronIcon = ({ up, className }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Animated Count Badge ─────────────────────────────────────────────────────
const CountBadge = ({ count }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { scale: 1.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' });
    }
  }, [count]);
  return (
    <span ref={ref} className="inline-flex items-center justify-center bg-emerald-700 text-white rounded-full text-[11px] font-bold px-2 py-0.5 min-w-[22px]">
      {count}
    </span>
  );
};

// ─── Active Filter Chip ───────────────────────────────────────────────────────
const FilterChip = ({ label, onRemove }) => {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(ref.current, { scale: 0.85, opacity: 0, x: -5 }, { scale: 1, opacity: 1, x: 0, duration: 0.25, ease: 'back.out(1.2)' });
  }, []);
  return (
    <span ref={ref} className="inline-flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded-full text-xs font-medium px-3 py-1.5 transition-all hover:bg-emerald-100">
      {label}
      <button onClick={onRemove} className="flex items-center justify-center rounded-full hover:bg-emerald-200/50 p-0.5 transition-colors">
        <CloseIcon />
      </button>
    </span>
  );
};

// ─── Accordion Section Component (FIXED: removed overflow hidden) ─────────────────────────────
const AccordionSection = ({ title, isOpen, onToggle, children, icon: Icon }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen, children]);

  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-neutral-50/50 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <span className="text-emerald-600/70 group-hover:text-emerald-700 transition-colors"><Icon /></span>}
          <span className="text-[11px] font-bold tracking-wider uppercase text-stone-500 group-hover:text-stone-700 transition-colors">{title}</span>
        </div>
        <ChevronIcon up={isOpen} className="text-stone-400 group-hover:text-stone-600 transition-all" />
      </button>
      <div
        ref={contentRef}
        className="transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] overflow-visible"
        style={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      >
        {isOpen && (
          <div className="pb-5 px-1">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Search Input Component (FIXED: dropdown properly positioned) ─────────────────────────────────
const CategorySearch = ({ categories, onSelect, activeSlug }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCategory = categories.find(c => c.slug === activeSlug);

  return (
    // Added 'relative z-30' here to create a new stacking context that clears subsequent accordions
    <div className="relative z-30">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          <SearchIcon />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
      </div>
      
      {/* Dropdown with high z-index and isolated layout context */}
      {isOpen && (filteredCategories.length > 0 || search) && (
        <div 
          ref={dropdownRef} 
          className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-xl max-h-48 overflow-y-auto"
          style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}
        >
          {filteredCategories.length > 0 ? (
            filteredCategories.map(cat => (
              <button
                key={cat._id}
                onClick={() => { onSelect(cat.slug); setSearch(''); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-emerald-50 transition-colors ${activeSlug === cat.slug ? 'bg-emerald-50 text-emerald-700' : 'text-stone-600'}`}
              >
                <span>{cat.name}</span>
                {activeSlug === cat.slug && <CheckIcon />}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-stone-400">No categories found</div>
          )}
        </div>
      )}
      
      {activeCategory && !search && (
        <div className="mt-3">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1.5 text-xs font-medium">
            <span>Active:</span>
            <span className="font-semibold">{activeCategory.name}</span>
            <button onClick={() => onSelect('')} className="ml-1 hover:bg-emerald-200 rounded-full p-0.5 transition-colors">
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Price Slider Component ─────────────────────────────────────────────────
const PriceSlider = ({ minVal, maxVal, onApply, disabled }) => {
  const [minPrice, setMinPrice] = useState(minVal || '');
  const [maxPrice, setMaxPrice] = useState(maxVal || '');

  useEffect(() => {
    setMinPrice(minVal || '');
    setMaxPrice(maxVal || '');
  }, [minVal, maxVal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    onApply({ min: minPrice, max: maxPrice });
  };

  const handleClear = () => {
    setMinPrice('');
    setMaxPrice('');
    onApply({ min: '', max: '' });
  };

  const hasValues = minPrice || maxPrice;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-stone-400 mb-1.5 tracking-wider">MIN PRICE</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">₹</span>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                disabled={disabled}
                className="w-full pl-7 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all disabled:opacity-50 disabled:bg-neutral-100"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-semibold text-stone-400 mb-1.5 tracking-wider">MAX PRICE</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">₹</span>
              <input
                type="number"
                placeholder="Any"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                disabled={disabled}
                className="w-full pl-7 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all disabled:opacity-50 disabled:bg-neutral-100"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={disabled}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all transform active:scale-95 ${
              disabled 
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
                : 'bg-stone-800 text-white hover:bg-emerald-700 shadow-md hover:shadow-emerald-100'
            }`}
          >
            Apply Filter
          </button>
          {hasValues && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </form>
      
      {disabled && (
        <div className="bg-amber-50/80 rounded-lg p-2.5 text-center">
          <p className="text-[11px] text-amber-700 font-medium">
            Price filter is disabled when a category is selected.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Custom Hook for dropdown positioning ─────────────────────────────────────
const useDropdownPosition = (inputRef, dropdownRef, isOpen) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && inputRef.current && dropdownRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen, inputRef, dropdownRef]);

  return position;
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { slug: routeSlug } = useParams()
  const navigate = useNavigate()
  const isOnCategoryRoute = !!routeSlug
  const activeCategory = routeSlug || searchParams.get('category') || '';
  const activeSort     = searchParams.get('sort') || 'newest';
  const activePage     = parseInt(searchParams.get('page') || '1', 10);
  const minPrice       = searchParams.get('minPrice') || '';
  const maxPrice       = searchParams.get('maxPrice') || '';

  const [products, setProducts]               = useState([]);
  const [categories, setCategories]           = useState([]);
  const [pagination, setPagination]           = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]                 = useState(true);
  const [isMobileFilterOpen, setMobileFilter] = useState(false);
  const [isCatExpanded, setCatExpanded]       = useState(true);
  const [isPriceExpanded, setPriceExpanded]   = useState(true);

  const gridRef         = useRef(null);
  const headerRef       = useRef(null);
  const sidebarRef      = useRef(null);
  const mobileDrawerRef = useRef(null);
  const controlsBarRef  = useRef(null);

  // Page-load entrance animation
  useGSAP(() => {
    const tl = gsap.timeline();
    if (headerRef.current) {
      tl.fromTo(headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
    if (sidebarRef.current) {
      tl.fromTo(sidebarRef.current,
        { opacity: 0, x: -25 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
        '-=0.5'
      );
    }
    if (controlsBarRef.current) {
      tl.fromTo(controlsBarRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        '-=0.3'
      );
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    categoryAPI.getAll()
      .then(res => { if (res.data?.success) setCategories(res.data.data); })
      .catch(err => console.error('Category fetch error:', err));
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        let response;
        if (activeCategory) {
          response = await productAPI.getByCategory(activeCategory);
          if (response.data?.success) {
            setProducts(response.data.data || []);
            setPagination({ total: response.data.count || 0, page: 1, pages: 1 });
          }
        } else {
          response = await productAPI.getAll({
            minPrice,
            maxPrice,
            sort: activeSort,
            page: activePage,
            limit: 12,
          });
          if (response.data?.success) {
            setProducts(response.data.data || []);
            setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
          }
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load products.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [activeCategory, activeSort, activePage, minPrice, maxPrice]);

  // Grid stagger animation
  useGSAP(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.gsap-product-card');
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 35, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' }
        );
      }
    }
  }, [products, loading]);

  // Mobile drawer animation
  useGSAP(() => {
    if (mobileDrawerRef.current) {
      if (isMobileFilterOpen) {
        document.body.style.overflow = 'hidden';
        gsap.to(mobileDrawerRef.current, { x: 0, duration: 0.45, ease: 'power4.out' });
      } else {
        document.body.style.overflow = '';
        gsap.to(mobileDrawerRef.current, { x: '-100%', duration: 0.35, ease: 'power3.in' });
      }
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileFilterOpen]);

  // URL helpers
  const updateUrlParams = (updates) => {
    // If we're on /category/:slug, any param change must redirect to /shop
    // because we can't clear a route param via setSearchParams
    if (isOnCategoryRoute) {
      const p = new URLSearchParams();
      // Merge current searchParams first
      searchParams.forEach((v, k) => p.set(k, v));
      if (!Object.prototype.hasOwnProperty.call(updates, 'page')) p.set('page', '1');
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') p.delete(k);
        else p.set(k, v);
      });
      // If category is being set, use /category route; otherwise go to /shop
      const newCat = updates.category !== undefined ? updates.category : routeSlug;
      if (newCat) {
        navigate(`/category/${newCat}?${p.toString()}`);
      } else {
        navigate(`/shop?${p.toString()}`);
      }
      return;
    }
    const p = new URLSearchParams(searchParams);
    if (!Object.prototype.hasOwnProperty.call(updates, 'page')) p.set('page', '1');
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') p.delete(k);
      else p.set(k, v);
    });
    setSearchParams(p);
  };

  const handleCategorySelect = (slug) => {
    const target = activeCategory === slug ? '' : slug;
    updateUrlParams({ category: target, minPrice: '', maxPrice: '' });
  };

  const handlePriceApply = ({ min, max }) => {
    updateUrlParams({ minPrice: min, maxPrice: max, category: '' });
  };

  const handleClearAll = () => {
    if (isOnCategoryRoute) {
      navigate('/shop');
    } else {
      setSearchParams({});
    }
  };

  const hasFilters = !!(activeCategory || minPrice || maxPrice);
  const activeCatName = categories.find(c => c.slug === activeCategory)?.name;

  // Filter Content Component
  const FilterContent = ({ onClose }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <span className="text-emerald-700"><LeafIcon /></span>
          <span className="font-serif text-xl font-bold text-emerald-800 tracking-tight">Filters</span>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button onClick={() => { handleClearAll(); onClose?.(); }} className="text-amber-600 text-xs font-bold underline underline-offset-4 hover:text-amber-700 transition-colors">
              Clear All
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-stone-500 hover:bg-neutral-200 transition-colors">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 py-2 overflow-visible">
        <AccordionSection
          title="Categories"
          isOpen={isCatExpanded}
          onToggle={() => setCatExpanded(!isCatExpanded)}
          icon={LeafIcon}
        >
          <CategorySearch
            categories={categories}
            onSelect={(slug) => { handleCategorySelect(slug); onClose?.(); }}
            activeSlug={activeCategory}
          />
        </AccordionSection>

        <AccordionSection
          title="Price Range"
          isOpen={isPriceExpanded}
          onToggle={() => setPriceExpanded(!isPriceExpanded)}
          icon={() => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          )}
        >
          <PriceSlider
            minVal={minPrice}
            maxVal={maxPrice}
            onApply={handlePriceApply}
            disabled={!!activeCategory}
          />
        </AccordionSection>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans text-stone-800">
      {/* Hero Banner */}
      <div ref={headerRef} className="relative px-5 py-14 text-center overflow-hidden">
        <div className="absolute -top-16 -right-20 w-80 h-80 rounded-full bg-gradient-radial from-emerald-100/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-radial from-amber-100/15 to-transparent pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 bg-emerald-50/60 backdrop-blur-sm border border-emerald-100 rounded-full px-4 py-1.5 text-xs font-bold text-emerald-700 tracking-wide uppercase mb-5">
          <LeafIcon /> Pure Organic Catalog
        </div>
        
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-emerald-900 tracking-tight leading-tight mb-4">
          The Organic Apothecary
        </h1>
        <p className="text-stone-500 max-w-lg mx-auto leading-relaxed">
          Cold-pressed botanicals, wild-harvested herbs &amp; premium nature-crafted extracts — curated for purity.
        </p>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 pb-16 flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside ref={sidebarRef} className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm border border-stone-100 transition-all hover:shadow-md overflow-visible">
            <FilterContent />
          </div>
        </aside>

        {/* Mobile Drawer */}
        <div ref={mobileDrawerRef} className="fixed inset-0 z-50 transform -translate-x-full lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileFilter(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl p-6 overflow-y-auto rounded-r-2xl">
            <FilterContent onClose={() => setMobileFilter(false)} />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Controls Bar */}
          <div ref={controlsBarRef} className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFilter(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <FilterIcon /> Filters {hasFilters && <CountBadge count={[activeCategory, minPrice || maxPrice].filter(Boolean).length} />}
              </button>
              <span className="text-sm text-stone-500">
                {loading ? 'Loading...' : <><span className="font-bold text-stone-800">{products.length}</span> products</>}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400 hidden sm:block">Sort by</span>
              <select
                value={activeSort}
                onChange={e => updateUrlParams({ sort: e.target.value })}
                disabled={!!activeCategory}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-600 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer disabled:opacity-50 disabled:bg-stone-50"
              >
                <option value="newest">New Arrivals</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="popular">Customer Favourites</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeCatName && (
                <FilterChip label={`Category: ${activeCatName}`} onRemove={() => updateUrlParams({ category: '' })} />
              )}
              {(minPrice || maxPrice) && (
                <FilterChip label={`Price: ₹${minPrice || '0'} – ₹${maxPrice || '∞'}`} onRemove={() => { updateUrlParams({ minPrice: '', maxPrice: '' }); }} />
              )}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No Products Found"
              message="Nothing matches these filters. Try clearing a filter or browsing a different category."
              actionText="Reset Filters"
              onAction={handleClearAll}
            />
          ) : (
            <div>
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product._id} className="gsap-product-card opacity-0">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && !activeCategory && (
                <nav className="mt-12 flex items-center justify-center gap-2 pt-6 border-t border-stone-100">
                  <button
                    onClick={() => updateUrlParams({ page: activePage - 1 })}
                    disabled={activePage === 1}
                    className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >← Prev</button>
                  
                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) pageNum = i + 1;
                      else if (activePage <= 3) pageNum = i + 1;
                      else if (activePage >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                      else pageNum = activePage - 2 + i;
                      
                      if (pageNum < 1 || pageNum > pagination.pages) return null;
                      
                      return (
                        <button key={pageNum} onClick={() => updateUrlParams({ page: pageNum })}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                            activePage === pageNum
                              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => updateUrlParams({ page: activePage + 1 })}
                    disabled={activePage === pagination.pages}
                    className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >Next →</button>
                </nav>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;