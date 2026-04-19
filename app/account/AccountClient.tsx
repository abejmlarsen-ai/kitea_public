'use client'

import { useState } from 'react'
import PasswordInput from '@/components/auth/PasswordInput'
import { createClient } from '@/lib/supabase/client'

// ── Palette ───────────────────────────────────────────────────────────────────
// Page gradient: #F2EDE3 (top/light) → #4A7C8C (mid) → #1B4965 (bottom/dark)
// Text:  light areas → #0B2838   dark areas → #FFFFFF

interface Profile {
  first_name:    string
  last_name:     string
  mobile_number: string
  date_of_birth: string
}

interface Stats {
  tagsScanned:    number
  nftsEarned:     number
  huntsCompleted: number
  memberSince:    string
}

interface Props {
  userId:  string
  email:   string
  profile: Profile
  stats:   Stats
}

// ── Small inline-edit row ─────────────────────────────────────────────────────
function EditRow({
  label,
  value,
  inputType = 'text',
  onSave,
  isPassword,
}: {
  label:       string
  value:       string
  inputType?:  string
  onSave:      (val: string, confirm?: string) => Promise<{ error?: string }>
  isPassword?: boolean
}) {
  const [editing,  setEditing]  = useState(false)
  const [val,      setVal]      = useState(value)
  const [confirm,  setConfirm]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function startEdit() {
    setVal(isPassword ? '' : value)
    setConfirm('')
    setMsg(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setMsg(null)
    setVal(value)
  }

  async function save() {
    if (isPassword && val !== confirm) {
      setMsg({ type: 'err', text: 'Passwords do not match.' })
      return
    }
    if (!val.trim()) {
      setMsg({ type: 'err', text: 'Field cannot be empty.' })
      return
    }
    setSaving(true)
    const result = await onSave(val, confirm)
    setSaving(false)
    if (result.error) {
      setMsg({ type: 'err', text: result.error })
    } else {
      setMsg({ type: 'ok', text: 'Saved.' })
      setEditing(false)
    }
  }

  const displayVal = isPassword ? '••••••••' : (value || '—')

  return (
    <div style={{
      borderBottom: '1px solid rgba(138,122,94,0.25)',
      padding:      '0.9rem 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4A7C8C', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '110px' }}>
          {label}
        </span>

        {editing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {isPassword ? (
              <PasswordInput
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder="New password"
                className="acct-input"
              />
            ) : (
              <input
                type={inputType}
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder={label}
                className="acct-input"
              />
            )}
            {isPassword && (
              <PasswordInput
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="acct-input"
              />
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
              <button onClick={save} disabled={saving} className="acct-btn-save">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={cancel} disabled={saving} className="acct-btn-cancel">
                Cancel
              </button>
            </div>
            {msg && (
              <p style={{ fontSize: '0.8rem', margin: 0, color: msg.type === 'ok' ? '#2a9d8f' : '#cc2200' }}>
                {msg.text}
              </p>
            )}
          </div>
        ) : (
          <>
            <span style={{ flex: 1, fontSize: '0.95rem', color: '#0B2838', wordBreak: 'break-all' }}>
              {displayVal}
            </span>
            <button onClick={startEdit} className="acct-btn-edit" aria-label={`Edit ${label}`}>
              ✏
            </button>
          </>
        )}
      </div>

      {!editing && msg?.type === 'ok' && (
        <p style={{ fontSize: '0.8rem', color: '#2a9d8f', margin: '0.3rem 0 0' }}>{msg.text}</p>
      )}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="acct-stat-card">
      <span className="acct-stat-value">{value}</span>
      <span className="acct-stat-label">{label}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AccountClient({ userId, email, profile: initialProfile, stats }: Props) {
  const supabase = createClient()

  // Local copies of editable profile fields (updates are reflected immediately)
  const [profile, setProfile] = useState(initialProfile)
  const [emailVal, setEmailVal] = useState(email)

  // ── Save handlers ─────────────────────────────────────────────────────────
  async function saveEmail(newEmail: string) {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (!error) setEmailVal(newEmail)
    return { error: error?.message }
  }

  async function savePassword(newPwd: string) {
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    return { error: error?.message }
  }

  async function saveProfileField(field: keyof typeof profile, val: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { error } = await db
      .from('profiles')
      .update({ [field]: val || null, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (!error) setProfile(prev => ({ ...prev, [field]: val }))
    return { error: error?.message }
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '7rem', paddingBottom: '4rem', padding: '7rem 1rem 4rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        <h1 style={{
          fontSize:      'clamp(2rem, 6vw, 2.75rem)',
          fontWeight:    800,
          color:         '#0B2838',
          marginBottom:  '2.5rem',
          letterSpacing: '-0.02em',
        }}>
          Account
        </h1>

        {/* ── Account Details ────────────────────────────────────────────── */}
        <section className="acct-card" style={{ marginBottom: '2rem' }}>
          <h2 className="acct-section-heading">Account Details</h2>

          <EditRow
            label="Email"
            value={emailVal}
            inputType="email"
            onSave={saveEmail}
          />
          <EditRow
            label="First name"
            value={profile.first_name}
            onSave={val => saveProfileField('first_name', val)}
          />
          <EditRow
            label="Last name"
            value={profile.last_name}
            onSave={val => saveProfileField('last_name', val)}
          />
          <EditRow
            label="Mobile"
            value={profile.mobile_number}
            inputType="tel"
            onSave={val => saveProfileField('mobile_number', val)}
          />
          <EditRow
            label="Date of birth"
            value={profile.date_of_birth}
            inputType="date"
            onSave={val => saveProfileField('date_of_birth', val)}
          />
          <EditRow
            label="Password"
            value=""
            isPassword
            onSave={savePassword}
          />
        </section>

        {/* ── Adventure Stats ────────────────────────────────────────────── */}
        <section>
          <h2 className="acct-section-heading acct-section-heading--dark">Adventure Stats</h2>
          <div className="acct-stats-grid">
            <StatCard value={stats.tagsScanned}   label="Tags scanned"    />
            <StatCard value={stats.nftsEarned}    label="Collectibles earned"     />
            <StatCard value={stats.huntsCompleted} label="Hunts completed" />
            <StatCard value={stats.memberSince}   label="Member since"    />
          </div>
        </section>

      </div>
    </div>
  )
}
