export default function HuntNotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: '#F5F0E8', color: '#0B2838', padding: '2rem', textAlign: 'center',
      position: 'relative', zIndex: 2,
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Hunt not found</h1>
      <a href="/map" style={{
        padding: '0.75rem 1.5rem', background: '#4A7C8C', color: '#FFFFFF',
        borderRadius: '6px', textDecoration: 'none', fontWeight: 600,
      }}>
        Return to Map
      </a>
    </div>
  )
}
