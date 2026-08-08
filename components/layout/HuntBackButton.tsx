'use client'

// One-step back — pure browser navigation, no server/DB call. Local unsaved
// UI state (typed-but-unsubmitted answers, open popups, etc.) is discarded
// for free since the page component unmounts on navigation; nothing already
// saved to hunt_progress is touched.
import { useRouter } from 'next/navigation'

export default function HuntBackButton() {
  const router = useRouter()
  return (
    <div style={{ background: '#F5F0E8', padding: '1rem 1.5rem 0', textAlign: 'center' }}>
      <button
        onClick={() => router.back()}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: '0.85rem', color: '#4A7C8C', fontWeight: 600, textDecoration: 'underline',
        }}
      >
        ← Back
      </button>
    </div>
  )
}
