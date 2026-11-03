import React, { useEffect, useState } from 'react'
import { workOrdersAPI } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, SectionHeader, Button, Badge, LoadingState, ErrorState } from '../../components/ui'

interface WorkOrder {
  id: number
  incident_id: number
  title?: string
  department: string
  status: string
  assigned_to?: string
  priority?: string
  created_at: string
  resolution_notes?: string
}

export default function WorkOrders() {
  const { user } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Action modals / state
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [actionType, setActionType] = useState<'assign' | 'resolve' | null>(null)
  const [actionInput, setActionInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchWorkOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await workOrdersAPI.list()
      const data = res.data?.work_orders ?? (Array.isArray(res.data) ? res.data : [])
      setWorkOrders(data)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to fetch work orders'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const handleStart = async (id: number) => {
    setActionLoading(true)
    setActionMsg(null)
    try {
      await workOrdersAPI.start(id)
      setActionMsg({ type: 'success', text: `Work order #${id} moved to IN_PROGRESS` })
      await fetchWorkOrders()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to start work order' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleExecuteModalAction = async () => {
    if (!selectedOrder || !actionType) return
    setActionLoading(true)
    setActionMsg(null)

    try {
      if (actionType === 'assign') {
        await workOrdersAPI.assign(selectedOrder.id, {
          department: actionInput || 'Public Works Department',
          assigned_to: user?.username || 'field_officer_1',
        })
        setActionMsg({ type: 'success', text: `Assigned work order #${selectedOrder.id}` })
      } else if (actionType === 'resolve') {
        await workOrdersAPI.resolve(selectedOrder.id, {
          resolution_notes: actionInput || 'Field inspection confirmed resolution. Infrastructure integrity restored.',
        })
        setActionMsg({ type: 'success', text: `Resolved work order #${selectedOrder.id}` })
      }
      setSelectedOrder(null)
      setActionType(null)
      setActionInput('')
      await fetchWorkOrders()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.detail || 'Operation failed' })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase()
    if (s.includes('resolved') || s.includes('closed')) return <Badge variant="low" dot>{status}</Badge>
    if (s.includes('progress') || s.includes('active')) return <Badge variant="high" dot>{status}</Badge>
    if (s.includes('pending') || s.includes('assigned')) return <Badge variant="cyan" dot>{status}</Badge>
    return <Badge variant="neutral">{status}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Operational Work Orders</h2>
          <p className="text-sm text-text-muted">Lifecycle dispatch, department coordination, and resolution verification</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchWorkOrders} disabled={loading}>
            ↻ Refresh List
          </Button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center justify-between ${
            actionMsg.type === 'success'
              ? 'bg-status-low/10 border border-status-low/30 text-status-low'
              : 'bg-status-critical/10 border border-status-critical/30 text-status-critical'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-text-muted hover:text-text-primary text-xs">
            ✕
          </button>
        </div>
      )}

      {loading && <LoadingState message="Loading work orders from operational database..." />}
      {error && <ErrorState message={error} onRetry={fetchWorkOrders} />}

      {!loading && !error && (
        <Card className="p-0 overflow-hidden">
          {workOrders.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <div className="text-3xl mb-2">≡</div>
              <p className="text-sm font-medium">No active work orders found.</p>
              <p className="text-xs text-text-muted mt-1">Submit an incident via Incident Intake to generate one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-elevated/40 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-3 px-4">WO ID</th>
                    <th className="py-3 px-4">Incident #</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {workOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-surface-interactive/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-accent-cyan">#{wo.id}</td>
                      <td className="py-3 px-4 font-mono text-text-muted">#{wo.incident_id}</td>
                      <td className="py-3 px-4 font-medium text-text-primary">{wo.department || 'General Municipal'}</td>
                      <td className="py-3 px-4">{getStatusBadge(wo.status)}</td>
                      <td className="py-3 px-4 text-text-secondary text-xs">{wo.assigned_to || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-xs font-mono text-text-muted">
                        {wo.created_at ? new Date(wo.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {wo.status?.toLowerCase() === 'pending' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(wo)
                              setActionType('assign')
                              setActionInput(wo.department || 'Engineering Division')
                            }}
                          >
                            Assign
                          </Button>
                        )}
                        {(wo.status?.toLowerCase() === 'assigned' || wo.status?.toLowerCase() === 'pending') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStart(wo.id)}
                            loading={actionLoading}
                          >
                            Start Work
                          </Button>
                        )}
                        {wo.status?.toLowerCase() === 'in_progress' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(wo)
                              setActionType('resolve')
                              setActionInput('Completed on-site civil works with photo verification.')
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                        {wo.status?.toLowerCase() === 'resolved' && (
                          <span className="text-xs text-status-low font-semibold">✓ Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Action Dialog / Modal */}
      {selectedOrder && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-card border border-border-standard rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary">
              {actionType === 'assign' ? `Assign Department for WO #${selectedOrder.id}` : `Submit Resolution Evidence for WO #${selectedOrder.id}`}
            </h3>
            <p className="text-xs text-text-muted">
              {actionType === 'assign'
                ? 'Specify the municipal agency and field officer responsible for executing this work order.'
                : 'Provide completion evidence and field signoff notes to mark incident as verified and resolved.'}
            </p>

            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase mb-1">
                {actionType === 'assign' ? 'Department / Unit Name' : 'Resolution Notes & Verification Evidence'}
              </label>
              {actionType === 'assign' ? (
                <input
                  type="text"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
                />
              ) : (
                <textarea
                  rows={4}
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedOrder(null)
                  setActionType(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteModalAction}
                loading={actionLoading}
              >
                Confirm {actionType === 'assign' ? 'Assignment' : 'Resolution'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
