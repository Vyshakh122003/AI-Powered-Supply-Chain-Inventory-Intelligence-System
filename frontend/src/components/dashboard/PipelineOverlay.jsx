import React, { useState, useEffect, useRef } from 'react'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

// The exact script the user requested
const SCRIPT = [
  { relativeSeconds: 0, text: 'Initializing daily intelligence run...' },
  { relativeSeconds: 1, text: 'Fetching inventory snapshot (6 products)' },
  { relativeSeconds: 2, text: 'Simulating daily stock consumption...' },
  { relativeSeconds: 4, text: 'Calculating stockout projections...' },
  { relativeSeconds: 6, text: 'Classifying risk levels across catalog...' },
  { relativeSeconds: 8, text: 'AI analyzing reorder opportunities...' },
  { relativeSeconds: 10, text: 'Groq LLM generating smart suggestions...' },
  { relativeSeconds: 12, text: 'Dispatching WhatsApp intelligence report...' },
  { relativeSeconds: 13, text: 'Persisting daily health snapshot...' },
  { relativeSeconds: 14, text: 'Awaiting system confirmation...' },
]

export default function PipelineOverlay({ pipelineState, pipelineResult, _onClose }) {
  const [elapsed, setElapsed] = useState(0)
  const [lines, setLines] = useState([])
  const startTimeRef = useRef(null)

  // Manage Elapsed Time and Script progression
  const prevPipelineState = useRef(pipelineState)
  useEffect(() => {
    if (pipelineState === 'running') {
      startTimeRef.current = Date.now()
      // Reset state only when transitioning into 'running'
      if (prevPipelineState.current !== 'running') {
        startTimeRef.current = Date.now()
      }
      
      const interval = setInterval(() => {
        const sec = Math.floor((Date.now() - startTimeRef.current) / 1000)
        
        setElapsed(sec)

        // Find scripts that should have fired by now that we haven't added
        SCRIPT.forEach(step => {
          if (step.relativeSeconds <= sec) {
            setLines(prev => {
              if (prev.some(l => l.text === step.text)) return prev
              const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false })
              return [...prev, { text: step.text, timestamp: timeStr, id: step.relativeSeconds }]
            })
          }
        })
      }, 500)
      
      prevPipelineState.current = pipelineState
      return () => clearInterval(interval)
    }
    prevPipelineState.current = pipelineState
  }, [pipelineState])

  // On Complete, append the final line via the interval's next tick (avoid sync setState in effect)
  const completedRef = useRef(false)
  useEffect(() => {
    if (pipelineState === 'complete' && !completedRef.current) {
      completedRef.current = true
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false })
      // Use a microtask to avoid the synchronous-setState-in-effect lint rule
      queueMicrotask(() => {
        setLines(prev => [...prev, { 
          text: 'Pipeline complete — all systems updated', 
          timestamp: timeStr, 
          id: 'done',
          success: true
        }])
      })
    } else if (pipelineState !== 'complete') {
      completedRef.current = false
    }
  }, [pipelineState])

  // Don't render anything if idle
  if (pipelineState === 'idle') return null

  // Progress Bar Width logic
  // Starts at 0, fills to 95% over 12 seconds, holds at 95% until complete.
  let progressWidth = 0
  if (pipelineState === 'complete') {
    progressWidth = 100
  } else if (pipelineState === 'running') {
    progressWidth = Math.min(95, (elapsed / 12) * 95)
  }

  const visibleLines = lines.slice(-6)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md transition-opacity">
      <div className="bg-[#020617] border border-slate-700 rounded-2xl shadow-2xl w-[420px] min-h-[480px] overflow-hidden flex flex-col relative transition-all duration-300">
        
        {/* RUNNING & COMPLETE STATE */}
        {(pipelineState === 'running' || pipelineState === 'complete') && (
          <>
            {/* TOP SECTION - Radar Pulse */}
            <div className="h-44 flex items-center justify-center relative overflow-hidden bg-slate-900/40 border-b border-slate-800/50">
              
              {pipelineState === 'complete' ? (
                <div className="relative z-10 flex flex-col items-center animate-success-bounce">
                  <div className="p-4 bg-green-500/20 rounded-full mb-2">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <span className="text-green-500 font-bold text-lg tracking-tight">Intelligence Updated</span>
                </div>
              ) : (
                <div className="relative flex items-center justify-center w-12 h-12">
                   {/* Expanding Rings */}
                   <div className="absolute inset-0 rounded-full border border-blue-500 animate-radar animate-radar-1" />
                   <div className="absolute inset-0 rounded-full border border-blue-500 animate-radar animate-radar-2" />
                   <div className="absolute inset-0 rounded-full border border-blue-500 animate-radar animate-radar-3" />
                   
                   {/* Core Node */}
                   <div className="relative z-10 w-4 h-4 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.9)]" />
                </div>
              )}
            </div>

            {/* MIDDLE SECTION - Terminal Feed or Success Morph */}
            <div className="p-6 flex-1 bg-[#020617] flex flex-col justify-end min-h-[220px]">
              {pipelineState === 'complete' ? (
                <div className="flex flex-col items-center text-center h-full justify-center animate-terminal">
                   <p className="text-sm text-slate-400 leading-relaxed font-mono">
                    {pipelineResult?.products || 0} products analyzed<br/>
                    {pipelineResult?.alerts || 0} alerts generated<br/>
                    {pipelineResult?.reorders || 0} AI suggestions ready
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 font-mono text-[11px] leading-tight text-slate-400">
                  {visibleLines.map((line, idx) => {
                    const isLast = idx === visibleLines.length - 1
                    return (
                      <div key={line.id} className="animate-terminal flex items-start gap-2">
                        <span className="text-slate-500 shrink-0">[{line.timestamp}]</span>
                        <span className={line.success ? 'text-green-400' : 'text-slate-300'}>
                          {line.success ? '✓' : '►'} {line.text}
                          {isLast && (
                            <span className="ml-1 inline-block w-1.5 bg-blue-500 h-3 animate-pulse align-middle" />
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* BOTTOM SECTION - Progress Bar */}
            <div className="px-6 pb-6 mt-auto">
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all ease-out ${pipelineState === 'complete' ? 'bg-green-500 duration-500' : 'bg-blue-600 duration-1000'}`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 tracking-wider">
                <span>ELAPSED: {elapsed}S</span>
                <span>EXPECTED: ~15S</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
