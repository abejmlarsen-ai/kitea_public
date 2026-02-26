'use client'
// ─── Admin Client ─────────────────────────────────────────────────────────────
// Full admin UI: 6 tabs (Locations, Products, NFC Tags, Orders, Users, Stats).
//
// All Supabase queries use an `any`-cast client.  This is intentional:
//  • Several tables (orders) and columns (price, tag_uid, is_admin,
//    total_scans) were added to the DB after the last type-generation run.
//  • Our local types (Location, Product, etc.) still enforce shape
//    correctness at the React-state level.
//  • eslint-disable comment is placed once at the client declaration.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Local types ────────────────────────────────────────────────────────────────

type Tab = 'locations' | 'products' | 'nfc_tags' | 'orders' | 'users' | 'stats'

type Location = {
  id: string
  name: string
  description: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean | null
  total_scans: number | null
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number | null
  image_url: string | null
  is_active: boolean | null
  requires_scan: boolean | null
  hunt_location_id: string | null
}

type NfcTag = {
  id: string
  uid: string
  tag_uid: string | null
  hunt_location_id: string | null
  is_active: boolean | null
  location_name: string | null
}

type Order = {
  id: string
  user_id: string
  stripe_session_id: string | null
  status: string
  total_amount: number
  currency: string
  created_at: string | null
}

type UserProfile = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile_number: string | null
  is_admin: boolean
  created_at: string | null
}

type Stats = {
  totalUsers: number
  totalScans: number
  totalOrders: number
  totalRevenue: number
  topLocation: string | null
}

type FormValues = Record<string, string | boolean | number | null | undefined>

const TAB_LABELS: Record<Tab, string> = {
  locations: 'Locations',
  products:  'Products',
  nfc_tags:  'NFC Tags',
  orders:    'Orders',
  users:     'Users',
  stats:     'Stats',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminClient() {
  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('locations')

  // Data per tab
  const [locations, setLocations] = useState<Location[]>([])
  const [products,  setProducts]  = useState<Product[]>([])
  const [nfcTags,   setNfcTags]   = useState<NfcTag[]>([])
  const [orders,    setOrders]    = useState<Order[]>([])
  const [users,     setUsers]     = useState<UserProfile[]>([])
  const [stats,     setStats]     = useState<Stats | null>(null)

  // UI state
  const [loading,   setLoading]   = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // Modal (add / edit)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [modalTab,  setModalTab]  = useState<Tab>('locations')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState<FormValues>({})
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Delete confirm
  const [deleteId,      setDeleteId]      = useState<string | null>(null)
  const [deleteTabName, setDeleteTabName] = useState<string>('')

  // Admin toggle per-row loading state
  const [togglingUser, setTogglingUser] = useState<string | null>(null)

  // Single any-cast client — avoids TS errors for columns / tables that were
  // added to the DB after the last `supabase gen types` run.
  const db: any = useMemo(() => createClient() as any, [])

  // ── Data fetchers ───────────────────────────────────────────────────────────

  const fetchLocations = useCallback(async () => {
    setLoading(true); setPageError(null)
    const { data, error } = await db
      .from('hunt_locations')
      .select('*')
      .order('name')
    if (error) { setPageError(error.message); setLoading(false); return }
    setLocations(
      (data ?? []).map((r: any) => ({
        id:          r.id,
        name:        r.name,
        description: r.description ?? null,
        latitude:    r.latitude ?? null,
        longitude:   r.longitude ?? null,
        is_active:   r.is_active ?? null,
        total_scans: r.total_scans ?? null,
      }))
    )
    setLoading(false)
  }, [db])

  const fetchProducts = useCallback(async () => {
    setLoading(true); setPageError(null)
    const { data, error } = await db
      .from('products')
      .select('*')
      .order('name')
    if (error) { setPageError(error.message); setLoading(false); return }
    setProducts(
      (data ?? []).map((r: any) => ({
        id:               r.id,
        name:             r.name,
        description:      r.description ?? null,
        image_url:        r.image_url ?? null,
        hunt_location_id: r.hunt_location_id ?? null,
        is_active:        r.is_active ?? null,
        price:            r.price ?? 0,
        stock_quantity:   r.stock_quantity ?? null,
        requires_scan:    r.requires_scan ?? null,
      }))
    )
    setLoading(false)
  }, [db])

  const fetchNfcTags = useCallback(async () => {
    setLoading(true); setPageError(null)
    const { data, error } = await db
      .from('nfc_tags')
      .select('*, hunt_locations!hunt_location_id(name)')
      .order('created_at', { ascending: false })
    if (error) { setPageError(error.message); setLoading(false); return }
    setNfcTags(
      (data ?? []).map((r: any) => ({
        id:               r.id,
        uid:              r.uid,
        tag_uid:          r.tag_uid ?? null,
        hunt_location_id: r.hunt_location_id ?? null,
        is_active:        r.is_active ?? null,
        location_name:    r.hunt_locations?.name ?? null,
      }))
    )
    setLoading(false)
  }, [db])

  const fetchOrders = useCallback(async () => {
    setLoading(true); setPageError(null)
    const { data, error } = await db
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setPageError(error.message); setLoading(false); return }
    setOrders((data ?? []) as Order[])
    setLoading(false)
  }, [db])

  const fetchUsers = useCallback(async () => {
    setLoading(true); setPageError(null)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`)
      setUsers((await res.json()) as UserProfile[])
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to fetch users')
    }
    setLoading(false)
  }, [])

  const fetchStats = useCallback(async () => {
    setLoading(true); setPageError(null)
    try {
      const [
        usersRes,
        scansRes,
        ordersRes,
        topLocRes,
      ] = await Promise.all([
        db.from('profiles').select('*', { count: 'exact', head: true }),
        db.from('scans').select('*',   { count: 'exact', head: true }),
        db.from('orders').select('total_amount,status'),
        db.from('hunt_locations')
          .select('name,total_scans')
          .order('total_scans', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const ordersData: any[] = ordersRes.data ?? []
      const revenue = ordersData
        .filter((o: any) => o.status === 'paid')
        .reduce((sum: number, o: any) => sum + (o.total_amount ?? 0), 0)

      setStats({
        totalUsers:   usersRes.count  ?? 0,
        totalScans:   scansRes.count  ?? 0,
        totalOrders:  ordersData.length,
        totalRevenue: revenue,
        topLocation:  topLocRes.data?.name ?? null,
      })
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load stats')
    }
    setLoading(false)
  }, [db])

  // ── Load on tab change ──────────────────────────────────────────────────────
  useEffect(() => {
    if      (activeTab === 'locations') fetchLocations()
    else if (activeTab === 'products')  fetchProducts()
    else if (activeTab === 'nfc_tags')  fetchNfcTags()
    else if (activeTab === 'orders')    fetchOrders()
    else if (activeTab === 'users')     fetchUsers()
    else if (activeTab === 'stats')     fetchStats()
  }, [
    activeTab,
    fetchLocations, fetchProducts, fetchNfcTags,
    fetchOrders, fetchUsers, fetchStats,
  ])

  // ── Modal helpers ───────────────────────────────────────────────────────────

  function openAdd(tab: Tab, defaults: FormValues = {}) {
    setModalMode('add'); setModalTab(tab); setEditingId(null)
    setForm({ is_active: true, requires_scan: false, ...defaults })
    setSaveError(null); setModalOpen(true)
  }

  function openEdit(tab: Tab, row: FormValues) {
    setModalMode('edit'); setModalTab(tab)
    setEditingId(row.id as string)
    setForm({ ...row }); setSaveError(null); setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false); setForm({}); setEditingId(null); setSaveError(null)
  }

  function setField(key: string, value: string | boolean | number | null) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true); setSaveError(null)
    try {
      if (modalTab === 'locations') {
        const payload = {
          name:        (form.name as string)?.trim(),
          description: (form.description as string) || null,
          latitude:    form.latitude != null && form.latitude !== ''
                         ? Number(form.latitude) : null,
          longitude:   form.longitude != null && form.longitude !== ''
                         ? Number(form.longitude) : null,
          is_active:   Boolean(form.is_active),
        }
        if (!payload.name) throw new Error('Name is required')
        const { error } = modalMode === 'add'
          ? await db.from('hunt_locations').insert(payload)
          : await db.from('hunt_locations').update(payload).eq('id', editingId)
        if (error) throw error
        await fetchLocations()

      } else if (modalTab === 'products') {
        const payload = {
          name:             (form.name as string)?.trim(),
          description:      (form.description as string) || null,
          price:            Number(form.price) || 0,
          stock_quantity:   form.stock_quantity != null && form.stock_quantity !== ''
                              ? Number(form.stock_quantity) : null,
          image_url:        (form.image_url as string) || null,
          is_active:        Boolean(form.is_active),
          requires_scan:    Boolean(form.requires_scan),
          hunt_location_id: (form.hunt_location_id as string) || null,
        }
        if (!payload.name) throw new Error('Name is required')
        const { error } = modalMode === 'add'
          ? await db.from('products').insert(payload)
          : await db.from('products').update(payload).eq('id', editingId)
        if (error) throw error
        await fetchProducts()

      } else if (modalTab === 'nfc_tags') {
        const payload = {
          uid:              (form.uid as string)?.trim(),
          tag_uid:          (form.tag_uid as string) || null,
          hunt_location_id: (form.hunt_location_id as string) || null,
          is_active:        Boolean(form.is_active),
        }
        if (!payload.uid) throw new Error('UID is required')
        const { error } = modalMode === 'add'
          ? await db.from('nfc_tags').insert(payload)
          : await db.from('nfc_tags').update(payload).eq('id', editingId)
        if (error) throw error
        await fetchNfcTags()
      }

      closeModal()
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Save failed'
      )
    }
    setSaving(false)
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteId || !deleteTabName) return
    const tableMap: Record<string, string> = {
      locations: 'hunt_locations',
      products:  'products',
      nfc_tags:  'nfc_tags',
    }
    const tableName = tableMap[deleteTabName]
    if (!tableName) return

    const { error } = await db.from(tableName).delete().eq('id', deleteId)
    if (error) { setPageError(error.message); return }

    setDeleteId(null); setDeleteTabName('')

    if      (activeTab === 'locations') await fetchLocations()
    else if (activeTab === 'products')  await fetchProducts()
    else if (activeTab === 'nfc_tags')  await fetchNfcTags()
  }

  // ── Admin toggle ────────────────────────────────────────────────────────────

  async function handleToggleAdmin(userId: string, current: boolean) {
    setTogglingUser(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: !current }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      setPageError(body.error ?? 'Failed to update admin status')
    }
    await fetchUsers()
    setTogglingUser(null)
  }

  // ── Form field helpers ──────────────────────────────────────────────────────

  function fi(
    key: string,
    label: string,
    type: 'text' | 'number' | 'textarea' | 'url' = 'text',
    placeholder?: string
  ) {
    return (
      <div className="admin-form-group" key={key}>
        <label>{label}</label>
        {type === 'textarea' ? (
          <textarea
            value={(form[key] as string) ?? ''}
            onChange={(e) => setField(key, e.target.value)}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            type={type}
            value={(form[key] as string | number) ?? ''}
            onChange={(e) => setField(key, e.target.value)}
            placeholder={placeholder}
            step={type === 'number' ? 'any' : undefined}
          />
        )}
      </div>
    )
  }

  function tog(key: string, label: string) {
    return (
      <div className="admin-form-group admin-form-group--toggle" key={key}>
        <label>{label}</label>
        <button
          type="button"
          className={`admin-toggle${form[key] ? ' admin-toggle--on' : ''}`}
          onClick={() => setField(key, !form[key])}
        >
          {form[key] ? 'Yes' : 'No'}
        </button>
      </div>
    )
  }

  function locSelect(key: string, label: string) {
    return (
      <div className="admin-form-group" key={key}>
        <label>{label}</label>
        <select
          value={(form[key] as string) ?? ''}
          onChange={(e) => setField(key, e.target.value || null)}
        >
          <option value="">— none —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
    )
  }

  function renderFormFields() {
    if (modalTab === 'locations')
      return (
        <>
          {fi('name',        'Name *',      'text', 'Location name')}
          {fi('description', 'Description', 'textarea')}
          {fi('latitude',    'Latitude',    'number', '-33.865')}
          {fi('longitude',   'Longitude',   'number', '151.209')}
          {tog('is_active', 'Active')}
        </>
      )
    if (modalTab === 'products')
      return (
        <>
          {fi('name',           'Name *',        'text')}
          {fi('description',    'Description',   'textarea')}
          {fi('price',          'Price (AUD)',    'number', '0.00')}
          {fi('stock_quantity', 'Stock Quantity', 'number')}
          {fi('image_url',      'Image URL',      'url')}
          {tog('is_active',     'Active')}
          {tog('requires_scan', 'Requires Scan')}
          {locSelect('hunt_location_id', 'Required Location')}
        </>
      )
    if (modalTab === 'nfc_tags')
      return (
        <>
          {fi('uid',     'UID *',    'text', 'NFC tag UID')}
          {fi('tag_uid', 'Tag UID',  'text', 'Alternate UID')}
          {locSelect('hunt_location_id', 'Location')}
          {tog('is_active', 'Active')}
        </>
      )
    return null
  }

  // ── Format helpers ──────────────────────────────────────────────────────────

  const fmt = {
    bool:     (v: boolean | null) => (v ? '✓' : '—'),
    date:     (v: string | null)  => v ? new Date(v).toLocaleDateString('en-AU') : '—',
    currency: (v: number, c = 'AUD') => `$${(v ?? 0).toFixed(2)} ${c}`,
    trunc:    (v: string | null, n = 22) =>
      v ? (v.length > n ? v.slice(0, n) + '…' : v) : '—',
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Admin Panel</h1>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <nav className="admin-tabs" aria-label="Admin sections">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`admin-tab${activeTab === tab ? ' admin-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      <main className="admin-content">
        {loading && <p className="admin-loading">Loading…</p>}
        {pageError && (
          <p className="admin-error">
            {pageError}{' '}
            <button
              className="admin-btn admin-btn--small"
              onClick={() => setPageError(null)}
            >
              Dismiss
            </button>
          </p>
        )}

        {/* ── LOCATIONS ─────────────────────────────────────────────────────── */}
        {activeTab === 'locations' && !loading && (
          <section>
            <div className="admin-toolbar">
              <h2>Locations</h2>
              <button
                className="admin-btn admin-btn--primary"
                onClick={() => openAdd('locations')}
              >
                + Add Location
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Description</th><th>Lat</th><th>Lng</th>
                    <th>Active</th><th>Scans</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.length === 0 ? (
                    <tr><td colSpan={7} className="admin-empty">No locations yet.</td></tr>
                  ) : locations.map((loc) => (
                    <tr key={loc.id}>
                      <td>{loc.name}</td>
                      <td>{fmt.trunc(loc.description)}</td>
                      <td>{loc.latitude ?? '—'}</td>
                      <td>{loc.longitude ?? '—'}</td>
                      <td>{fmt.bool(loc.is_active)}</td>
                      <td>{loc.total_scans ?? 0}</td>
                      <td className="admin-actions">
                        <button
                          className="admin-btn admin-btn--small"
                          onClick={() => openEdit('locations', {
                            id: loc.id, name: loc.name,
                            description: loc.description, latitude: loc.latitude,
                            longitude: loc.longitude, is_active: loc.is_active,
                          })}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() => { setDeleteId(loc.id); setDeleteTabName('locations') }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── PRODUCTS ──────────────────────────────────────────────────────── */}
        {activeTab === 'products' && !loading && (
          <section>
            <div className="admin-toolbar">
              <h2>Products</h2>
              <button
                className="admin-btn admin-btn--primary"
                onClick={() => openAdd('products', { price: 0, requires_scan: false })}
              >
                + Add Product
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Price</th><th>Stock</th><th>Active</th>
                    <th>Req. Scan</th><th>Location</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={7} className="admin-empty">No products yet.</td></tr>
                  ) : products.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{fmt.currency(p.price)}</td>
                      <td>{p.stock_quantity ?? '∞'}</td>
                      <td>{fmt.bool(p.is_active)}</td>
                      <td>{fmt.bool(p.requires_scan)}</td>
                      <td>{locations.find((l) => l.id === p.hunt_location_id)?.name ?? '—'}</td>
                      <td className="admin-actions">
                        <button
                          className="admin-btn admin-btn--small"
                          onClick={() => openEdit('products', {
                            id: p.id, name: p.name, description: p.description,
                            price: p.price, stock_quantity: p.stock_quantity,
                            image_url: p.image_url, is_active: p.is_active,
                            requires_scan: p.requires_scan,
                            hunt_location_id: p.hunt_location_id,
                          })}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() => { setDeleteId(p.id); setDeleteTabName('products') }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── NFC TAGS ──────────────────────────────────────────────────────── */}
        {activeTab === 'nfc_tags' && !loading && (
          <section>
            <div className="admin-toolbar">
              <h2>NFC Tags</h2>
              <button
                className="admin-btn admin-btn--primary"
                onClick={() => openAdd('nfc_tags')}
              >
                + Add Tag
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>UID</th><th>Tag UID</th><th>Location</th>
                    <th>Active</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nfcTags.length === 0 ? (
                    <tr><td colSpan={5} className="admin-empty">No tags yet.</td></tr>
                  ) : nfcTags.map((tag) => (
                    <tr key={tag.id}>
                      <td><code>{fmt.trunc(tag.uid, 18)}</code></td>
                      <td><code>{fmt.trunc(tag.tag_uid, 18)}</code></td>
                      <td>{tag.location_name ?? '—'}</td>
                      <td>{fmt.bool(tag.is_active)}</td>
                      <td className="admin-actions">
                        <button
                          className="admin-btn admin-btn--small"
                          onClick={() => openEdit('nfc_tags', {
                            id: tag.id, uid: tag.uid, tag_uid: tag.tag_uid,
                            hunt_location_id: tag.hunt_location_id,
                            is_active: tag.is_active,
                          })}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() => { setDeleteId(tag.id); setDeleteTabName('nfc_tags') }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── ORDERS (read-only) ────────────────────────────────────────────── */}
        {activeTab === 'orders' && !loading && (
          <section>
            <div className="admin-toolbar">
              <h2>Orders</h2>
              <span className="admin-toolbar-note">Read-only</span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th><th>Status</th><th>Amount</th>
                    <th>Currency</th><th>Date</th><th>Stripe Session</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} className="admin-empty">No orders yet.</td></tr>
                  ) : orders.map((o) => (
                    <tr key={o.id}>
                      <td><code title={o.user_id}>{o.user_id.slice(0, 8)}…</code></td>
                      <td>
                        <span className={`admin-badge admin-badge--${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>{fmt.currency(o.total_amount ?? 0)}</td>
                      <td>{o.currency?.toUpperCase() ?? '—'}</td>
                      <td>{fmt.date(o.created_at)}</td>
                      <td>
                        <code title={o.stripe_session_id ?? ''}>
                          {fmt.trunc(o.stripe_session_id, 14)}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── USERS ─────────────────────────────────────────────────────────── */}
        {activeTab === 'users' && !loading && (
          <section>
            <div className="admin-toolbar"><h2>Users</h2></div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Mobile</th>
                    <th>Admin</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={5} className="admin-empty">No users yet.</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.first_name} {u.last_name}</td>
                      <td>{u.email ?? '—'}</td>
                      <td>{u.mobile_number ?? '—'}</td>
                      <td>
                        <button
                          className={`admin-toggle${u.is_admin ? ' admin-toggle--on' : ''}`}
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          disabled={togglingUser === u.id}
                        >
                          {togglingUser === u.id ? '…' : u.is_admin ? 'Admin' : 'User'}
                        </button>
                      </td>
                      <td>{fmt.date(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        {activeTab === 'stats' && !loading && stats && (
          <section>
            <div className="admin-toolbar"><h2>Stats</h2></div>
            <div className="admin-stat-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-value">{stats.totalUsers}</div>
                <div className="admin-stat-label">Total Users</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{stats.totalScans}</div>
                <div className="admin-stat-label">Total Scans</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{stats.totalOrders}</div>
                <div className="admin-stat-label">Total Orders</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">
                  {fmt.currency(stats.totalRevenue)}
                </div>
                <div className="admin-stat-label">Revenue (Paid)</div>
              </div>
              {stats.topLocation && (
                <div className="admin-stat-card admin-stat-card--wide">
                  <div className="admin-stat-value">📍 {stats.topLocation}</div>
                  <div className="admin-stat-label">Most Scanned Location</div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'stats' && !loading && !stats && !pageError && (
          <p className="admin-empty">No stats available yet.</p>
        )}
      </main>

      {/* ── Add / Edit modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3>
                {modalMode === 'add' ? 'Add' : 'Edit'} {TAB_LABELS[modalTab]}
              </h3>
              <button className="admin-modal-close" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
                {renderFormFields()}
                {saveError && (
                  <p className="admin-error admin-error--form">{saveError}</p>
                )}
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn--primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ───────────────────────────────────────────────── */}
      {deleteId && (
        <div
          className="admin-modal-overlay"
          onClick={() => { setDeleteId(null); setDeleteTabName('') }}
        >
          <div
            className="admin-modal admin-modal--confirm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3>Confirm Delete</h3>
            <p>This action cannot be undone. Are you sure?</p>
            <div className="admin-modal-footer">
              <button
                className="admin-btn"
                onClick={() => { setDeleteId(null); setDeleteTabName('') }}
              >
                Cancel
              </button>
              <button className="admin-btn admin-btn--danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
