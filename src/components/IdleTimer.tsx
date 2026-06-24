'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

const IDLE_TIMEOUT = 15 * 60 * 1000
const WARNING_BEFORE = 30 * 1000

export default function IdleTimer() {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const idleTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const warningTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const countdownInterval = useRef<ReturnType<typeof setInterval>|null>(null)
  const isLoggedIn = useRef(false)

  function clearAllTimers() {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (countdownInterval.current) clearInterval(countdownInterval.current)
  }

  async function signOut() {
    clearAllTimers()
    setShowWarning(false)
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function resetTimer() {
    if (!isLoggedIn.current) return
    clearAllTimers()
    setShowWarning(false)
    setCountdown(30)

    warningTimer.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(30)
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, IDLE_TIMEOUT - WARNING_BEFORE)

    idleTimer.current = setTimeout(() => {
      signOut()
    }, IDLE_TIMEOUT)
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      isLoggedIn.current = true
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
      events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
      resetTimer()
    }

    init()

    return () => {
      clearAllTimers()
      isLoggedIn.current = false
    }
  }, [])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <div className="text-4xl mb-3">⏱️</div>
        <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Georgia,serif', color: '#1E1B4B' }}>
          Still there?
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          You have been inactive for a while.
        </p>
        <p className="text-2xl font-bold mb-5" style={{ color: '#4F46E5' }}>
          Signing out in {countdown}s
        </p>
        <button className="btn-primary py-3 mb-3" onClick={resetTimer}>
          Keep me signed in
        </button>
        <button className="w-full py-2 text-sm text-gray-400" onClick={signOut}>
          Sign out now
        </button>
      </div>
    </div>
  )
}
