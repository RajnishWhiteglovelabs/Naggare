\'use client\'
import { useEffect, useState } from \'react\'
import { useRouter } from \'next/navigation\'
import { supabase } from \'@/lib/supabase-browser\'

const ADMIN_EMAIL = \'raj@whiteglovelabs.io\'

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<\'overview\'|\'candidates\'|\'recruiters\'|\'jds\'>(\'overview\')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email || session.user.email.toLowerCase() !== ADMIN_EMAIL) {
        router.push(\'/\')
        return
      }
      const res = await fetch(\'/api/admin/stats\', {
        method: \'POST\',
        headers: { \'Content-Type\': \'application/json\' },
        body: JSON.stringify({ email: session.user.email }),
      })
      if (!res.ok) { router.push(\'/\'); return }
      setData(await res.json())
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:\'#F1F0FB\'}}>
      <p className="text-sm" style={{color:\'#4F46E5\'}}>Loading admin dashboard...</p>
    </div>
  )

  const { stats, candidates, recruiters, recentJds } = data

  const statCards = [
    { label: \'Total Candidates\', value: stats.candidates.total, sub: `+${stats.candidates.newThisWeek} this week`, color: \'#4F46E5\', bg: \'#EEF2FF\' },
    { label: \'Active Candidates\', value: stats.candidates.active, sub: `${stats.candidates.total - stats.candidates.active} incomplete`, color: \'#4F46E5\', bg: \'#EEF2FF\' },
    { label: \'Total Recruiters\', value: stats.recruiters.total, sub: `+${stats.recruiters.newThisWeek} this week`, color: \'#15803D\', bg: \'#F0FDF4\' },
    { label: \'Active Recruiters\', value: stats.recruiters.active, sub: `${stats.recruiters.total - stats.recruiters.active} inactive`, color: \'#15803D\', bg: \'#F0FDF4\' },
    { label: \'JDs Live\', value: stats.jds.active, sub: `${stats.jds.total} total posted`, color: \'#7C3AED\', bg: \'#F5F3FF\' },
    { label: \'Active Chats\', value: stats.chats.active, sub: `${stats.chats.expired} expired`, color: \'#C2410C\', bg: \'#FFF7ED\' },
  ]

  const tabs = [\'overview\', \'candidates\', \'recruiters\', \'jds\']

  return (
    <div className="min-h-screen" style={{background:\'#F1F0FB\',fontFamily:\'Raleway,sans-serif\'}}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:\'linear-gradient(135deg,#4F46E5,#7C3AED)\'}}>
            <span className="text-sm font-bold text-white" style={{fontFamily:\'Georgia,serif\'}}>N</span>
          </div>
          <div>
            <p className="font-bold text-sm" style={{color:\'#1E1B4B\'}}>Naggare Admin</p>
            <p className="text-xs" style={{color:\'#9CA3AF\'}}>Founder Dashboard</p>
          </div>
        </div>
        <button onClick={() => router.push(\'/recruiter/home\')} className="text-xs font-semibold px-3 py-1.5 rounded-full border" style={{borderColor:\'#E0E7FF\',color:\'#4F46E5\'}}>
          Back to App
        </button>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className="px-4 py-2 rounded-xl text-xs font-bold capitalize border transition-colors"
              style={{
                background: activeTab === tab ? \'#4F46E5\' : \'white\',
                color: activeTab === tab ? \'white\' : \'#6B7280\',
                borderColor: activeTab === tab ? \'#4F46E5\' : \'#E5E7EB\'
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === \'overview\' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {statCards.map((card, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:\'#9CA3AF\'}}>{card.label}</p>
                  <p className="text-3xl font-bold mb-1" style={{color:card.color}}>{card.value}</p>
                  <p className="text-xs" style={{color:\'#9CA3AF\'}}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent JDs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-bold text-sm" style={{color:\'#1E1B4B\'}}>Recent JDs</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr style={{background:\'#F9FAFB\'}}>
                    {[\'Title\',\'Company\',\'Recruiter\',\'Status\',\'Posted\'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold" style={{color:\'#6B7280\'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {recentJds.map((jd: any, i: number) => (
                      <tr key={i} style={{borderTop:\'1px solid #F3F4F6\'}}>
                        <td className="px-4 py-3 font-semibold" style={{color:\'#1E1B4B\'}}>{jd.title}</td>
                        <td className="px-4 py-3" style={{color:\'#374151\'}}>{jd.company}</td>
                        <td className="px-4 py-3" style={{color:\'#6B7280\'}}>{jd.recruiter_email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{background:jd.status===\'open\'?\'#F0FDF4\':\'#F9FAFB\',color:jd.status===\'open\'?\'#15803D\':\'#6B7280\'}}>
                            {jd.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{color:\'#9CA3AF\'}}>{new Date(jd.created_at).toLocaleDateString(\'en-IN\')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CANDIDATES */}
        {activeTab === \'candidates\' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bold text-sm" style={{color:\'#1E1B4B\'}}>All Candidates ({candidates.length})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{background:\'#F9FAFB\'}}>
                  {[\'Name\',\'Email\',\'Domain\',\'City\',\'Exp\',\'Availability\',\'Status\',\'Joined\'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold" style={{color:\'#6B7280\'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {candidates.map((c: any, i: number) => (
                    <tr key={i} style={{borderTop:\'1px solid #F3F4F6\'}}>
                      <td className="px-4 py-3 font-semibold" style={{color:\'#1E1B4B\'}}>{c.name || \'—\'}</td>
                      <td className="px-4 py-3" style={{color:\'#6B7280\'}}>{c.email}</td>
                      <td className="px-4 py-3" style={{color:\'#374151\'}}>{c.domain || \'—\'}</td>
                      <td className="px-4 py-3" style={{color:\'#374151\'}}>{c.city || \'—\'}</td>
                      <td className="px-4 py-3" style={{color:\'#374151\'}}>{c.years_exp ? `${c.years_exp}y` : \'—\'}</td>
                      <td className="px-4 py-3">
                        {c.availability ? <span className="px-2 py-0.5 rounded-full font-semibold"
                          style={{background:c.availability===\'Actively looking\'?\'#F0FDF4\':\'#EEF2FF\',color:c.availability===\'Actively looking\'?\'#15803D\':\'#4F46E5\'}}>
                          {c.availability}
                        </span> : \'—\'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full font-semibold"
                          style={{background:c.status===\'active\'?\'#F0FDF4\':\'#FFF7ED\',color:c.status===\'active\'?\'#15803D\':\'#C2410C\'}}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{color:\'#9CA3AF\'}}>{new Date(c.created_at).toLocaleDateString(\'en-IN\')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RECRUITERS */}
        {activeTab === \'recruiters\' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-sm" style={{color:\'#1E1B4B\'}}>All Recruiters ({recruiters.length})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{background:\'#F9FAFB\'}}>
                  {[\'Name\',\'Email\',\'Company\',\'Title\',\'Status\',\'Joined\'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold" style={{color:\'#6B7280\'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {recruiters.map((r: any, i: number) => (
                    <tr key={i} style={{borderTop:\'1px solid #F3F4F6\'}}>
                      <td className="px-4 py-3 font-semibold" style={{color:\'#1E1B4B\'}}>{r.name || \'—\'}</td>
                      <td className="px-4 py-3" style={{color:\'#6B7280\'}}>{r.email}</td>
                      <td className="px-4 py-3" style={{color:\'#374151\'}}>{r.company || \'—\'}</td>
                      <td className="px-4 py-3" style={{color:\'#374151\'}}>{r.title || \'—\'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full font-semibold"
                          style={{background:r.status===\'active\'?\'#F0FDF4\':\'#FFF7ED\',color:r.status===\'active\'?\'#15803D\':\'#C2410C\'}}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{color:\'#9CA3AF\'}}>{new Date(r.created_at).toLocaleDateString(\'en-IN\')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* JDs */}
        {activeTab === \'jds\' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-sm" style={{color:\'#1E1B4B\'}}>Recent JDs ({recentJds.length})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{background:\'#F9FAFB\'}}>
                  {[\'Title\',\'Company\',\'Recruiter\',\'Status\',\'Expires\',\'Posted\'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold" style={{color:\'#6B7280\'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {recentJds.map((jd: any, i: number) => (
                    <tr key={i} style={{borderTop:\'1px solid #F3F4F6\'}}>
                      <td className="px-4 py-3 font-semibold" style={{color:\'#1E1B4B\'}}>{jd.title}</td>
                      <td className="px-4 py-3" style={{color:\'#374151\'}}>{jd.company}</td>
                      <td className="px-4 py-3" style={{color:\'#6B7280\'}}>{jd.recruiter_email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full font-semibold"
                          style={{background:jd.status===\'open\'?\'#F0FDF4\':\'#F9FAFB\',color:jd.status===\'open\'?\'#15803D\':\'#6B7280\'}}>
                          {jd.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{color:\'#9CA3AF\'}}>{jd.expires_at ? new Date(jd.expires_at).toLocaleDateString(\'en-IN\') : \'—\'}</td>
                      <td className="px-4 py-3" style={{color:\'#9CA3AF\'}}>{new Date(jd.created_at).toLocaleDateString(\'en-IN\')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
