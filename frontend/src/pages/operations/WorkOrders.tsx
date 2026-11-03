import { useEffect, useState, useMemo } from 'react'
import { workOrdersAPI, normalizeWorkOrder, NormalizedWorkOrder } from '../../lib/api'
import { Card, SectionHeader, Button, Badge, LoadingState, ErrorState } from '../../components/ui'
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  Play, 
  FileCheck, 
  Search, 
  Filter, 
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react'

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<NormalizedWorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modals
  const [activeModal, setActiveModal] = useState<'assign' | 'resolve' | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<NormalizedWorkOrder | null>(null)
  const [modalInput, setModalInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchWorkOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await workOrdersAPI.list()
      const raw = res.data?.data ?? (Array.isArray(res.data) ? res.data : [])
      const normalized = raw.map(normalizeWorkOrder)
      setWorkOrders(normalized)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to retrieve work orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  // Filtered List
  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesSearch =
        wo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wo.assignee && wo.assignee.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        statusFilter === 'All' || wo.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [workOrders, searchQuery, statusFilter])

  // Lifecycle Action 1: Start Work
  const handleStartWork = async (wo: NormalizedWorkOrder) => {
    setActionLoading(true)
    setNotification(null)
    try {
      await workOrdersAPI.start(wo.id)
      setNotification({ type: 'success', message: `Work order ${wo.id} transitioned to IN_PROGRESS.` })
      await fetchWorkOrders()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to start work order',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Open Modal (Assign or Resolve)
  const openModal = (type: 'assign' | 'resolve', wo: NormalizedWorkOrder) => {
    setSelectedOrder(wo)
    setActiveModal(type)
    setModalInput(type === 'assign' ? 'Drainage Response Team Alpha' : 'Field inspection confirmed resolution. Infrastructure cleared and restored.')
    setNotification(null)
  }

  // Submit Modal Action
  const handleModalSubmit = async () => {
    if (!selectedOrder || !modalInput.trim()) return
    setActionLoading(true)
    setNotification(null)

    try {
      if (activeModal === 'assign') {
        // PATCH /api/work-orders/{id}/assign with { assignee: string }
        await workOrdersAPI.assign(selectedOrder.id, modalInput.trim())
        setNotification({
          type: 'success',
          message: `Work order ${selectedOrder.id} successfully assigned to ${modalInput.trim()}.`,
        })
      } else if (activeModal === 'resolve') {
        // PATCH /api/work-orders/{id}/resolve with { evidence: string }
        await workOrdersAPI.resolve(selectedOrder.id, modalInput.trim())
        setNotification({
          type: 'success',
          message: `Work order ${selectedOrder.id} marked as RESOLVED with cryptographic evidence.`,
        })
      }
      setActiveModal(null)
      setSelectedOrder(null)
      await fetchWorkOrders()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.detail || 'Action failed to execute',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'resolved') return <Badge variant="low" dot>Resolved</Badge>
    if (s === 'in_progress') return <Badge variant="high" dot>In Progress</Badge>
    if (s === 'assigned') return <Badge variant="blue" dot>Assigned</Badge>
    return <Badge variant="cyan" dot>Open</Badge>
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Header & Controls ──────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Work Order Management & Field Dispatch"
            subtitle="Durable lifecycle state machine with foreign-key referential integrity & evidence tracking"
            badge={`${workOrders.length} Tracked Orders`}
          />

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchWorkOrders}
          >
            Refresh Orders
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border-subtle">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Open', 'Assigned', 'In_Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-accent-blue text-white shadow-glow-blue'
                    : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-border-subtle'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search order ID, incident ID, crew..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-surface-elevated border border-border-standard rounded-xl text-text-primary input-focus w-64"
            />
          </div>
        </div>
      </Card>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-fade-in ${
            notification.type === 'success'
              ? 'bg-severity-low/15 border-severity-low/30 text-severity-low'
              : 'bg-severity-critical/15 border-severity-critical/30 text-severity-critical'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── Work Orders Table ──────────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingState message="Fetching operational work order state..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchWorkOrders} />
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs">
            No work orders found matching current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-base/60 text-text-muted font-mono uppercase">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Linked Incident</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Created Time</th>
                  <th className="py-3 px-4 text-right">Lifecycle Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredOrders.map((wo) => {
                  const s = wo.status.toLowerCase()
                  return (
                    <tr key={wo.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-accent-cyan">
                        {wo.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-text-secondary">
                        {wo.incident_id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-text-primary">
                        {wo.department}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(wo.status)}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {wo.assignee ? (
                          <span className="font-medium text-text-primary">{wo.assignee}</span>
                        ) : (
                          <span className="text-text-muted italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-text-muted">
                        {formatDate(wo.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {s === 'open' && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<UserPlus size={13} />}
                            onClick={() => openModal('assign', wo)}
                          >
                            Assign Crew
                          </Button>
                        )}
                        {s === 'assigned' && (
                          <Button
                            variant="cyan"
                            size="sm"
                            icon={<Play size={13} />}
                            loading={actionLoading}
                            onClick={() => handleStartWork(wo)}
                          >
                            Start Work
                          </Button>
                        )}
                        {s === 'in_progress' && (
                          <Button
                            variant="purple"
                            size="sm"
                            icon={<FileCheck size={13} />}
                            onClick={() => openModal('resolve', wo)}
                          >
                            Resolve Order
                          </Button>
                        )}
                        {s === 'resolved' && (
                          <span className="text-[11px] font-mono text-severity-low flex items-center justify-end gap-1">
                            <CheckCircle2 size={13} /> Verified Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── Modal Dialog (Assign / Resolve) ─────────────────────────────────── */}
      {activeModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-bg-midnight/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-bg-card border border-border-standard p-6 space-y-4 shadow-card-elevated animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {activeModal === 'assign' ? 'Assign Field Dispatch Crew' : 'Submit Resolution Evidence'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Order ID: <span className="font-mono text-accent-cyan font-bold">{selectedOrder.id}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                {activeModal === 'assign' ? 'Assignee / Field Response Team' : 'Resolution Evidence / Supervisor Note'}
              </label>
              {activeModal === 'assign' ? (
                <input
                  type="text"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder="e.g. Drainage Response Team Alpha"
                  className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus font-medium"
                />
              ) : (
                <textarea
                  rows={3}
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder="Describe resolution proof, inspection findings, restored flow..."
                  className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus"
                />
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant={activeModal === 'assign' ? 'primary' : 'purple'}
                className="flex-1 font-bold"
                loading={actionLoading}
                onClick={handleModalSubmit}
              >
                {activeModal === 'assign' ? 'Confirm Assignment' : 'Verify & Resolve'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
