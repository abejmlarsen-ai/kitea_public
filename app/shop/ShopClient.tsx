'use client'

// ─── Shop Client Component ────────────────────────────────────────────────────
// Handles product grid, cart state, and Stripe checkout redirect.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ShopProduct } from './page'

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
}

export default function ShopClient({ products, userId, unlockedProductIds }: Props) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // A product is locked if it is tied to a hunt location and not yet unlocked.
  function isLocked(product: ShopProduct): boolean {
    if (!product.hunt_location_id) return false
    return !unlockedProductIds.includes(product.id)
  }

  function addToCart(product: ShopProduct) {
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
        { product_id: product.id, name: product.name, price: product.price, quantity: 1 },
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

  return (
    <div className="shop-page">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="shop-hero">
        <h1>Shop</h1>
        <p>Exclusive items — some unlocked by your adventures.</p>
      </section>

      {/* ── Floating cart toggle ─────────────────────────────────────────────── */}
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
        {/* ── Product grid ──────────────────────────────────────────────────── */}
        <main className="shop-grid">
          {products.length === 0 && (
            <p className="shop-empty">No products available yet — check back soon.</p>
          )}

          {products.map((product) => {
            const locked = isLocked(product)

            return (
              <article
                key={product.id}
                className={`shop-card${locked ? ' shop-card--locked' : ''}`}
              >
                {/* Image */}
                {product.image_url ? (
                  <div className="shop-card-image-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="shop-card-image"
                    />
                    {locked && <div className="shop-card-lock">🔒</div>}
                  </div>
                ) : (
                  <div className="shop-card-image-placeholder">
                    {locked ? '🔒' : '✦'}
                  </div>
                )}

                {/* Text */}
                <div className="shop-card-body">
                  <h3 className="shop-card-name">{product.name}</h3>

                  {product.description && (
                    <p className="shop-card-desc">{product.description}</p>
                  )}

                  {locked ? (
                    <p className="shop-card-locked-msg">Scan the location to unlock</p>
                  ) : (
                    <p className="shop-card-price">
                      {product.price > 0 ? `$${product.price.toFixed(2)}` : 'Free'}
                    </p>
                  )}

                  <button
                    className="shop-card-btn"
                    disabled={locked || product.price === 0}
                    onClick={() => !locked && addToCart(product)}
                  >
                    {locked ? 'Locked' : 'Add to Cart'}
                  </button>
                </div>
              </article>
            )
          })}
        </main>

        {/* ── Cart sidebar ──────────────────────────────────────────────────── */}
        {cartOpen && (
          <aside className="shop-cart">
            <div className="shop-cart-header">
              <h2>Your Cart</h2>
              <button
                className="shop-cart-close"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                ✕
              </button>
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
                        <span className="shop-cart-item-price">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="shop-cart-item-qty">
                        <button
                          onClick={() => updateQuantity(item.product_id, -1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        <button
                          className="shop-cart-item-remove"
                          onClick={() => removeFromCart(item.product_id)}
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="shop-cart-footer">
                  <div className="shop-cart-total">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)} AUD</span>
                  </div>
                  <button
                    className="shop-cart-checkout-btn"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
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
