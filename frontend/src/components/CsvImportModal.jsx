import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { postWebhook, WEBHOOKS } from '../lib/config'
import toast from 'react-hot-toast'
import {
  Upload, X, FileSpreadsheet, Loader2, CheckCircle2,
  AlertTriangle, Download,
} from 'lucide-react'

const SAMPLE_CSV = `product_id,product_name,category,current_stock,reorder_threshold,unit_price,avg_daily_sales,unit,preferred_supplier_id
RICE_001,Basmati Rice 5kg,Rice & Grains,25,10,450,3.5,bags,SUP_GRAINS
OIL_001,Sunflower Oil 1L,Cooking Oil,15,8,180,2.0,bottles,SUP_SNACKS
SOAP_001,Lux Soap Bar,Personal Care,40,20,45,5.0,pcs,SUP_DRINKS`

/**
 * Parse a single CSV line respecting quoted fields (RFC 4180).
 * Handles commas inside double-quoted values and escaped quotes ("").
 */
function parseCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCsv(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [], error: 'CSV must have at least a header row and one data row' }

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''))
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length !== headers.length) continue
    const row = {}
    headers.forEach((h, idx) => { row[h] = values[idx] })
    rows.push(row)
  }

  return { headers, rows, error: null }
}

export default function CsvImportModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      toast.error('Please select a .csv file')
      return
    }

    setFile(f)
    setResults(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      const parsed = parseCsv(text)
      if (parsed.error) {
        toast.error(parsed.error)
        setPreview(null)
        return
      }

      // Validate required headers
      const missing = ['product_id', 'product_name'].filter(h => !parsed.headers.includes(h))
      if (missing.length > 0) {
        toast.error(`Missing required columns: ${missing.join(', ')}`)
        setPreview(null)
        return
      }

      setPreview(parsed)
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    if (!preview || preview.rows.length === 0) return
    if (!user?.id) {
      toast.error('You must be logged in to import products.')
      return
    }

    setImporting(true)
    let success = 0
    let failed = 0
    const errors = []

    try {
      // Fetch the store_id from the user's profile directly at import time
      let storeId = null
      try {
        const { data: profile } = await supabase
          .from('Store Profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        storeId = profile?.id || null
      } catch {
        // If profile fetch fails, continue without store_id
        console.warn('Could not fetch store profile for import, continuing without store_id')
      }

      for (const row of preview.rows) {
        const productData = {
          product_id: row.product_id,
          product_name: row.product_name,
          category: row.category || null,
          current_stock: Number(row.current_stock) || 0,
          reorder_threshold: Number(row.reorder_threshold) || 0,
          unit_price: Number(row.unit_price) || 0,
          avg_daily_sales: Number(row.avg_daily_sales) || 0,
          unit: row.unit || 'pcs',
          preferred_supplier_id: row.preferred_supplier_id || null,
        }

        // Add store_id only if we have one
        if (storeId) {
          productData.store_id = storeId
        }

        try {
          // Insert directly into Supabase Products table
          const { error: upsertError } = await supabase
            .from('Products')
            .upsert(productData, { onConflict: 'product_id' })

          if (upsertError) throw upsertError

          // Fire WF-01 webhook in background (non-blocking)
          // This lets n8n do its data cleaning pipeline
          try {
            await postWebhook(WEBHOOKS.productIngest, productData)
          } catch {
            // Webhook failure is non-fatal — DB is the source of truth
          }

          success++
        } catch (err) {
          failed++
          errors.push(`${row.product_id}: ${err.message || 'Failed to save product'}`)
        }
      }

      setResults({ success, failed, errors })
      if (success > 0) {
        toast.success(`Imported ${success} product${success > 1 ? 's' : ''}`)
        onSuccess?.()
      }
      if (failed > 0) {
        toast.error(`${failed} product${failed > 1 ? 's' : ''} failed to import`)
      }
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stocksense_products_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setResults(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-accent" />
            Import Products from CSV
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Instructions */}
          <div className="text-sm text-muted space-y-2">
            <p>
              Upload a CSV file with your product data. Required columns:
              <strong className="text-text"> product_id</strong> and
              <strong className="text-text"> product_name</strong>.
            </p>
            <p>
              Optional columns: category, current_stock, reorder_threshold,
              unit_price, avg_daily_sales, unit, preferred_supplier_id.
            </p>
          </div>

          {/* Download template */}
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download CSV template
          </button>

          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
          >
            <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text">
              {file ? file.name : 'Click to select CSV file'}
            </p>
            <p className="text-xs text-muted mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'CSV files only'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {preview && !results && (
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">
                Preview ({preview.rows.length} product{preview.rows.length !== 1 ? 's' : ''})
              </h3>
              <div className="overflow-x-auto border border-border rounded-lg max-h-48">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-border">
                      {preview.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {preview.headers.map((h) => (
                          <td key={h} className="px-3 py-1.5 text-text whitespace-nowrap">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {preview.rows.length > 5 && (
                      <tr>
                        <td colSpan={preview.headers.length} className="px-3 py-1.5 text-muted text-center">
                          ... and {preview.rows.length - 5} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              {results.success > 0 && (
                <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {results.success} product{results.success !== 1 ? 's' : ''} imported successfully
                </div>
              )}
              {results.failed > 0 && (
                <div className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {results.failed} product{results.failed !== 1 ? 's' : ''} failed
                  </div>
                  <ul className="text-xs ml-6 space-y-0.5">
                    {results.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-text transition-colors cursor-pointer"
          >
            {results ? 'Done' : 'Cancel'}
          </button>
          {preview && !results && (
            <button
              onClick={handleImport}
              disabled={importing || preview.rows.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {importing ? 'Importing...' : `Import ${preview.rows.length} Product${preview.rows.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
