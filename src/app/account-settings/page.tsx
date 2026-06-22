'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function AccountSettings() {
  const router = useRouter()

  const [section, setSection] = useState<'main' | 'password' | 'email' | 'delete'>('main')

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function showMsg(text: string, type: 'success' | 'error') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) return showMsg('Please fill all fields', 'error')
    if (newPassword !== confirmPassword) return showMsg('New passwords don\'t match', 'error')
    if (newPassword.length < 8) return showMsg('Password must be at least 8 characters', 'error')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) throw new Error('Not signed in')
      // Re-authenticate first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      })
      if (signInError) throw new Error('Current password is incorrect')
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
      showMsg('Password updated successfully!', 'success')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setSection('main'), 1500)
    } catch (e: any) {
      showMsg(e.message || 'Failed to update password', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function changeEmail() {
    if (!newEmail || !emailPassword) return showMsg('Please fill all fields', 'error')
    if (!newEmail.includes('@')) return showMsg('Enter a valid email', 'error')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) throw new Error('Not signed in')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: emailPassword,
      })
      if (signInError) throw new Error('Password is incorrect')
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw new Error(error.message)
      showMsg('Confirmation sent to your new email. Please verify it.', 'success')
      setNewEmail(''); setEmailPassword('')
    } catch (e: any) {
      showMsg(e.message || 'Failed to update email', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') return showMsg('Type DELETE to confirm', 'error')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) throw new Error('Not signed in')
      const userEmail = session.user.email

      // Get name for email
      const meRes = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      })
      const profile = meRes.ok ? await meRes.json() : null
      const userName = profile?.name || userEmail

      // Mark as deleted in DB
      const saveRoute = profile?.type === 'recruiter' ? '/api/recruiter/save' : '/api/candidate/save'
      await fetch(saveRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, status: 'deleted' }),
      })

      // Send deletion confirmation email
      await fetch('/api/email/account-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: userName }),
      })

      await supabase.auth.signOut()
      router.push('/')
    } catch (e: any) {
      showMsg(e.message || 'Failed to delete account', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#1E1B4B,#312e81)' }}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur px-5 h-14 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => section === 'main' ? router.push('/home') : setSection('main')}
          className="text-2xl text-white">‹</button>
        <span className="font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>
          {section === 'main' ? 'Account Settings' : section === 'password' ? 'Change Password' : section === 'email' ? 'Change Email' : 'Delete Account'}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {message.text}
          </div>
        )}

        {/* MAIN MENU */}
        {section === 'main' && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account</p>
              <p className="text-sm text-gray-500">Manage your Naggare account settings</p>
            </div>
            {[
              { icon: '🔑', label: 'Change Password', sub: 'Update your password', action: () => setSection('password') },
              { icon: '📧', label: 'Change Email', sub: 'Update your email address', action: () => setSection('email') },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-indigo-50 transition-colors text-left">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </button>
            ))}
            <button onClick={() => setSection('delete')}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors text-left">
              <span className="text-2xl">🗑️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-500">Delete Account</p>
                <p className="text-xs text-gray-400">Permanently remove your profile</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </button>
          </div>
        )}

        {/* CHANGE PASSWORD */}
        {section === 'password' && (
          <div className="bg-white rounded-3xl p-5 shadow-2xl">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#1E1B4B' }}>Change Password</h2>
            <p className="text-sm text-gray-400 mb-5">Choose a strong password of at least 8 characters.</p>
            <div className="mb-4">
              <label className="label">Current password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="label">New password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="label">Confirm new password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <button className="btn-primary py-4" onClick={changePassword} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}

        {/* CHANGE EMAIL */}
        {section === 'email' && (
          <div className="bg-white rounded-3xl p-5 shadow-2xl">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#1E1B4B' }}>Change Email</h2>
            <p className="text-sm text-gray-400 mb-5">We'll send a confirmation to your new email address.</p>
            <div className="mb-4">
              <label className="label">New email address</label>
              <input className="input" type="email" placeholder="new@email.com"
                value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="label">Confirm with your password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={emailPassword} onChange={e => setEmailPassword(e.target.value)} />
            </div>
            <button className="btn-primary py-4" onClick={changeEmail} disabled={loading}>
              {loading ? 'Updating...' : 'Update Email'}
            </button>
          </div>
        )}

        {/* DELETE ACCOUNT */}
        {section === 'delete' && (
          <div className="bg-white rounded-3xl p-5 shadow-2xl">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#991B1B' }}>Delete Account</h2>
            <p className="text-sm text-gray-500 mb-4">This will permanently delete your profile and all your data. This cannot be undone.</p>
            <div className="p-3 rounded-xl mb-5 text-sm text-red-700" style={{ background: '#FEF2F2', border: '0.5px solid #FECACA' }}>
              ⚠️ Your profile, career history, prompts and skills will be permanently removed.
            </div>
            <div className="mb-6">
              <label className="label">Type <strong>DELETE</strong> to confirm</label>
              <input className="input" placeholder="DELETE"
                value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
            </div>
            <button
              className="w-full py-4 rounded-2xl text-white font-semibold text-base"
              style={{ background: deleteConfirm === 'DELETE' ? '#DC2626' : '#E5E7EB', color: deleteConfirm === 'DELETE' ? 'white' : '#9CA3AF' }}
              onClick={deleteAccount} disabled={loading || deleteConfirm !== 'DELETE'}>
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
