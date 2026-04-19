'use client'

// ─── Shop Client Component ────────────────────────────────────────────────────
// Hunt-reward shop: every product is tied to a hunt, visible only after scanning.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ShopProduct, HuntGroup } from './page'

type Props = {
  huntGroups: HuntGroup[]
  userId: string | null
}

function isComingSoon(product: ShopProduct): boolean {
  return product.image_url === null || product.price === null || product.stripe_price_id === null
}

export default function ShopClient({ huntGroups, userId }: Props) {
  const router = useRouter()
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  async function handleAddToCart(product: ShopProduct) {
    if (!product.stripe_price_id || product.price === null) return
    if (!userId) {
      router.push('/login?redirect=/shop')
      return
    }

    setCheckingOut(product.id)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: product.stripe_price_id,
          product_id: product.id,
        }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Checkout failed. Please try again.')
        setCheckingOut(null)
      }
    } catch {
      alert('Connection error. Please try again.')
      setCheckingOut(null)
    }
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (huntGroups.length === 0) {
    return (
      <div className="shop-page">
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '48px 24px',
            background: '#0B2838',
            color: '#F2EDE3',
            borderRadius: '16px',
            margin: '32px auto',
            maxWidth: '560px',
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px', color: '#F2EDE3' }}>
            The Shop
          </h1>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', color: '#C9A84C' }}>
            No items unlocked
          </h2>
          <p style={{ fontSize: '1rem', color: '#A8C4CC', marginBottom: '32px', maxWidth: '360px' }}>
            Complete a hunt to unlock exclusive products
          </p>
          <Link
            href="/map"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#4A7C8C',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            Explore the Map
          </Link>
        </div>
      </div>
    )
  }

  // ── Products state ──────────────────────────────────────────────────────────

  return (
    <div className="shop-page">
      <section className="shop-hero">
        <h1>The Shop</h1>
        <p>Exclusive items unlocked by your adventures.</p>
      </section>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px 64px' }}>
        {huntGroups.map((group) => (
          <div key={group.hunt_location_id} style={{ marginBottom: '48px' }}>
            {/* Hunt section heading */}
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#0B2838',
                marginBottom: '20px',
                paddingBottom: '8px',
                borderBottom: '2px solid #C4B08E',
              }}
            >
              {group.hunt_name}
            </h2>

            {/* Product grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {group.products.map((product) =>
                isComingSoon(product) ? (
                  <ComingSoonCard
                    key={product.id}
                    product={product}
                    scanNumber={group.scan_number}
                  />
                ) : (
                  <PurchasableCard
                    key={product.id}
                    product={product}
                    scanNumber={group.scan_number}
                    onAddToCart={handleAddToCart}
                    isLoading={checkingOut === product.id}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Coming Soon Card ──────────────────────────────────────────────────────────

function ComingSoonCard({
  product,
  scanNumber,
}: {
  product: ShopProduct
  scanNumber: number
}) {
  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '2px dashed #C4B08E',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Coming Soon badge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: '#C9A84C',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '0 12px 0 8px',
          zIndex: 2,
        }}
      >
        Coming Soon
      </div>

      {/* Placeholder image area with Kitea logo */}
      <div
        style={{
          height: '200px',
          background: '#F2EDE3',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <img
          src="/images/Kitea Logo Only.png"
          alt=""
          style={{
            width: '80px',
            height: '80px',
            opacity: 0.15,
            objectFit: 'contain',
          }}
        />
      </div>

      <h3 style={{ fontWeight: 700, color: '#0B2838', fontSize: '1rem', margin: '0 0 8px' }}>
        {product.name}
      </h3>

      <p style={{ color: '#8A7A5E', fontSize: '0.9rem', margin: '0 0 8px', lineHeight: 1.4 }}>
        Product unlocked. Available for purchase shortly.
      </p>

      <p style={{ color: '#4A7C8C', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
        You are #{scanNumber} to find this tag
      </p>
    </article>
  )
}

// ── Purchasable Card ──────────────────────────────────────────────────────────

function PurchasableCard({
  product,
  scanNumber,
  onAddToCart,
  isLoading,
}: {
  product: ShopProduct
  scanNumber: number
  onAddToCart: (product: ShopProduct) => void
  isLoading: boolean
}) {
  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '1px solid #0B2838',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Product image */}
      <div
        style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <img
          src={product.image_url!}
          alt={product.name}
          style={{
            maxWidth: '100%',
            maxHeight: '200px',
            objectFit: 'contain',
          }}
        />
      </div>

      <h3 style={{ fontWeight: 700, color: '#0B2838', fontSize: '1rem', margin: '0 0 8px' }}>
        {product.name}
      </h3>

      {product.description && (
        <p style={{ color: '#555', fontSize: '0.9rem', margin: '0 0 8px', lineHeight: 1.4 }}>
          {product.description}
        </p>
      )}

      <p style={{ color: '#4A7C8C', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 12px' }}>
        You are #{scanNumber} to find this tag
      </p>

      <p style={{ fontWeight: 700, color: '#0B2838', fontSize: '1.1rem', margin: '0 0 16px' }}>
        ${product.price!.toFixed(2)}
      </p>

      {product.stripe_price_id && (
        <button
          onClick={() => onAddToCart(product)}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: isLoading ? '#8AAFBA' : '#4A7C8C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {isLoading ? 'Redirecting...' : 'Add to Cart'}
        </button>
      )}
    </article>
  )
}
