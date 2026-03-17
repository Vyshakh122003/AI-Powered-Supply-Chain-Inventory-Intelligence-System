import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  FileText, Loader2, RefreshCw, Search,
  CheckCircle2, XCircle, Clock, AlertTriangle, Info,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const PAGE_SIZE = 25

const LEVEL_CONFIG = {
  success: { icon: CheckCircle2,  bg: 'bg-success/10', text: 'text-success', label: 'Success' },
  warning: { icon: AlertTriangle, bg: 'bg-warning/10', text: 'text-warning', label: 'Warning' },
  error:   { icon: XCircle,       bg: 'bg-danger/10',  text: 'text-danger',  label: 'Error' },
  info:    { icon: Info,          bg: 'bg-accent/10',  text: 'text-accent',  label: 'Info' },
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('System Logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`workflow_name.ilike.%${search}%,error_message.ilike.%${search}%`)
      }
      if (levelFilter !== 'ALL') {
        query = query.eq('status', levelFilter)
      }

      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      setLogs(data || [])
      setTotalCount(count || 0)
    } catch {
      toast.error('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [search, levelFilter, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(0)
  }, [search, levelFilter])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'System Logs' }, () => {
        fetchLogs()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchLogs])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const formatTime = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" />
            System Logs
          </h1>
          <p className="text-sm text-muted">
            {totalCount} log entr{totalCount === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted border border-border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="ALL">All Levels</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Logs list */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-10 h-10 text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text">No logs found</p>
            <p className="text-xs text-muted mt-1">
              {search || levelFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Logs will appear here when workflows run'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const config = LEVEL_CONFIG[log.status] || LEVEL_CONFIG.info
              const LevelIcon = config.icon

              return (
                <div key={log.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Level icon */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${config.bg}`}>
                      <LevelIcon className={`w-4 h-4 ${config.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{log.workflow_name}</p>
                      {log.error_message && (
                        <p className="text-sm text-danger mt-0.5">{log.error_message}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {log.records_processed != null && (
                          <span className="text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded">
                            {log.records_processed} records
                          </span>
                        )}
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(log.ran_at || log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
