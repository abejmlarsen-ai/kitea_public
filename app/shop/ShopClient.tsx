"use client"

// ─── Shop Client Component ────────────────────────────────────────────────────
// Renders products grouped into coloured rows by hunt location.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ShopProduct, HuntLocation } from './page'

type CartItem = {
  product_id: string
  name: string
  price: number
  quantity: number
}

type Props = {
  products: ShopProduct[]
  userId: string | null
  unlockedProductIds: string[]
  locations: HuntLocation[]
  hasScanned: boolean
}

// Row colour palette — index maps to hunt order
const ROW_COLORS = [
  { header: '#0169aa', light: '#e8f4fc' },  // Hunt 1 — blue
  { header: '#c9a227', light: '#fdf6e3' },  // Hunt 2 — gold
  { header: '#27ae60', light: '#e8f8f0' },  // Hunt 3 — green
  { header: '#8e44ad', light: '#f4e8fc' },  // Hunt 4 — purple
  { header: '#e74c3c', light: '#fce8e8' },  // Hunt 5 — red
  { header: '#16a085', light: '#e8f8f5' },  // Hunt 6 — teal
]

export default function ShopClient({ products, userId, unlockedProductIds, locations, hasScanned }: Props) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // Filter out scan-gated products if user hasn't scanned
  const visibleProducts = products.filter((p) => {
    if (p.requires_scan && !hasScanned) return false
    return true
  })

  function isLocked(product: ShopProduct): boolean {
    if (!product.hunt_location_id) return false
    return !unlockedProductIds.includes(product.id)
  }

  function isComingSoon(product: ShopProduct): boolean {
    return product.price === null && product.requires_scan
  }

  function addToCart(product: ShopProduct) {
    if (product.price === null || product.price <= 0) return
    if (!userId) {
      router.push('/login?redirect=/shop')
      return
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        { product_id: product.id, name: product.name, price: product.price ?? 0, quantity: 1 },
      ]
    })
    setCartOpen(true)
  }

  function removeFromCart(product_id: string) {
    setCart((prev) => prev.filter((i) => i.product_id !== product_id))
  }

  function updateQuantity(product_id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.product_id === product_id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  async function handleCheckout() {
    if (!userId) {
      router.push('/login?redirect=/shop')
      return
    }
    if (cart.length === 0) return

    setIsCheckingOut(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Checkout failed. Please try again.')
        setIsCheckingOut(false)
      }
    } catch {
      alert('Connection error. Please try again.')
      setIsCheckingOut(false)
    }
  }

  // ── Group products ──────────────────────────────────────────────────────────

  // Separate general (no hunt) products from hunt-specific ones
  const generalProducts = visibleProducts.filter((p) => !p.hunt_location_id)

  // Build hunt groups in the order locations are sorted
  const huntGroups = locations
    .map((loc) => ({
      location: loc,
      products: visibleProducts.filter((p) => p.hunt_location_id === loc.id),
    }))
    .filter((g) => g.products.length > 0)

  // ── Coming Soon card renderer ─────────────────────────────────────────────

  function ComingSoonCard({ product }: { product: ShopProduct }) {
    return (
      <article
        className="shop-card"
        style={{
          border: '2px dashed #C4B08E',
          background: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Coming Soon badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#C9A84C',
            color: '#FFFFFF',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '4px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            zIndex: 2,
          }}
        >
          Coming Soon
        </div>

        {/* Placeholder image area with Kitea logo watermark */}
        {product.image_url ? (
          <div className="shop-card-image-wrapper">
            <img src={product.image_url} alt={product.name} className="shop-card-image" />
          </div>
        ) : (
          <div
            className="shop-card-image-placeholder"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <img
              src="/images/Kitea Logo Only.png"
              alt=""
              style={{
                width: '64px',
                height: '64px',
                opacity: 0.2,
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        <div className="shop-card-body">
          <h3 className="shop-card-name">{product.name}</h3>
          {product.description && (
            <p className="shop-card-desc">{product.description}</p>
          )}
        </div>
      </article>
    )
  }

  // ── Product card renderer ───────────────────────────────────────────────────

  function ProductCard({ product, bgLight }: { product: ShopProduct; bgLight?: string }) {
    if (isComingSoon(product)) {
      return <ComingSoonCard product={product} />
    }

    const locked = isLocked(product)
    return (
      <article
        className={`shop-card${locked ? ' shop-card--locked' : ''}`}
        style={bgLight ? { background: bgLight } : undefined}
      >
        {product.image_url ? (
          <div className="shop-card-image-wrapper">
            <img src={product.image_url} alt={product.name} className="shop-card-image" />
            {locked && <div className="shop-card-lock">🔒</div>}
          </div>
        ) : (
          <div className="shop-card-image-placeholder">
            {locked ? '🔒' : '✦'}
          </div>
        )}

        <div className="shop-card-body">
          <h3 className="shop-card-name">{product.name}</h3>
          {product.description && (
            <p className="shop-card-desc">{product.description}</p>
          )}
          {locked ? (
            <p className="shop-card-locked-msg">Scan the location to unlock</p>
          ) : product.price !== null ? (
            <p className="shop-card-price">
              {product.price > 0 ? `$${product.price.toFixed(2)}` : 'Free'}
            </p>
          ) : null}
          {locked ? (
            <button className="shop-card-btn" disabled>Locked</button>
          ) : product.price !== null && product.price > 0 ? (
            <button
              className="shop-card-btn"
              onClick={() => addToCart(product)}
            >
              Add to Cart
            </button>
          ) : null}
        </div>
      </article>
    )
  }

  return (
    <div className="shop-page">
      {/* Hero */}
      <section className="shop-hero">
        <h1>Shop</h1>
        <p>Exclusive items — some unlocked by your adventures.</p>
      </section>

      {/* Floating cart toggle */}
      {cartCount > 0 && (
        <button
          className="shop-cart-toggle"
          onClick={() => setCartOpen((o) => !o)}
          aria-label="Open cart"
        >
          🛒&nbsp;<span className="shop-cart-badge">{cartCount}</span>
        </button>
      )}

      <div className="shop-layout">
        {/* Hunt rows */}
        <main className="shop-hunt-rows">
          {visibleProducts.length === 0 && (
            <p className="shop-empty">No products available yet — check back soon.</p>
          )}

          {/* General / always-available products */}
          {generalProducts.length > 0 && (
            <div className="hunt-row">
              <div className="hunt-row-header" style={{ background: '#2d3142' }}>
                <h2 className="hunt-row-title">General</h2>
                <span className="hunt-row-subtitle">Available to everyone</span>
              </div>
              <div className="hunt-row-body">
                {generalProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {/* Hunt-specific rows */}
          {huntGroups.map((group, idx) => {
            const color = ROW_COLORS[idx % ROW_COLORS.length]
            return (
              <div key={group.location.id} className="hunt-row">
                <div className="hunt-row-header" style={{ background: color.header }}>
                  <h2 className="hunt-row-title">{group.location.name}</h2>
                  <span className="hunt-row-subtitle">Scan the tag to unlock</span>
                </div>
                <div className="hunt-row-body">
                  {group.products.map((p) => (
                    <ProductCard key={p.id} product={p} bgLight={color.light} />
                  ))}
                </div>
              </div>
            )
          })}
        </main>

        {/* Cart sidebar */}
        {cartOpen && (
          <aside className="shop-cart">
            <div className="shop-cart-header">
              <h2>Your Cart</h2>
              <button className="shop-cart-close" onClick={() => setCartOpen(false)} aria-label="Close cart">✕</button>
            </div>

            {cart.length === 0 ? (
              <p className="shop-cart-empty">Your cart is empty.</p>
            ) : (
              <>
                <ul className="shop-cart-list">
                  {cart.map((item) => (
                    <li key={item.product_id} className="shop-cart-item">
                      <div className="shop-cart-item-info">
                        <span className="shop-cart-item-name">{item.name}</span>
                        <span className="shop-cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="shop-cart-item-qty">
                        <button onClick={() => updateQuantity(item.product_id, -1)} aria-label="Decrease">−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, 1)} aria-label="Increase">+</button>
                        <button className="shop-cart-item-remove" onClick={() => removeFromCart(item.product_id)} aria-label="Remove">✕</button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="shop-cart-footer">
                  <div className="shop-cart-total">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)} AUD</span>
                  </div>
                  <button className="shop-cart-checkout-btn" onClick={handleCheckout} disabled={isCheckingOut}>
                    {isCheckingOut ? 'Redirecting…' : 'Checkout →'}
                  </button>
                </div>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
