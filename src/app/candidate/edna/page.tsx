'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const PHASES = [
  { id: 1, name: 'Refactoring', duration: 8 * 60, description: 'Review and improve code with Edna' },
  { id: 2, name: 'System Design', duration: 10 * 60, description: 'Design a system together' },
]

const ROLE_LEVELS = ['SDE 2', 'SDE 3', 'Staff Engineer', 'Engineering Manager', 'Senior EM']

// ElevenLabs voice ID for Edna - warm, human, friendly
const EDNA_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah - warm and natural

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function EdnaSession() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stage, setStage] = useState<'welcome' | 'consent' | 'session' | 'score'>('welcome')
  const [roleLevel, setRoleLevel] = useState('SDE 2')
  const [phase, setPhase] = useState(1)
  const [messages, setMessages] = useState<Message[]>([])
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(PHASES[0].duration)
  const [scores, setScores] = useState<any>(null)
  const [scoring, setScoring] = useState(false)

  // Voice states
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [transcript, setTranscript] = useState('')

  // Video/recording states
  const [cameraOn, setCameraOn] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (!session?.user) { router.push('/signin'); return }
      setUser(session.user)
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Setup camera
  async function setupCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraOn(true)
      return stream
    } catch (e) {
      console.error('Camera error:', e)
      return null
    }
  }

  // Start recording
  function startRecording(stream: MediaStream) {
    recordedChunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data)
    }
    mediaRecorder.start(1000)
    mediaRecorderRef.current = mediaRecorder
    setRecording(true)
  }

  // Stop recording and upload
  async function stopRecordingAndUpload() {
    if (!mediaRecorderRef.current) return null
    return new Promise<string | null>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        try {
          const filename = 'edna-session-' + user?.email?.replace('@', '-').replace('.', '-') + '-' + Date.now() + '.webm'
          const { data, error } = await supabase.storage.from('edna-sessions').upload(filename, blob, {
            contentType: 'video/webm',
            upsert: true
          })
          if (!error && data) {
            const { data: urlData } = supabase.storage.from('edna-sessions').getPublicUrl(filename)
            resolve(urlData.publicUrl)
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      }
      mediaRecorderRef.current!.stop()
    })
  }

  // Edna speaks via ElevenLabs
  async function ednaSpeak(text: string) {
    if (!voiceMode) return
    // Strip code blocks before speaking - Edna describes code, doesn't read it
    const spokenText = text
      .replace(/```[\s\S]*?```/g, '... I\'ve dropped the code in the chat, take a look ...')
      .replace(/`[^`]+`/g, '')
      .trim()
    if (!spokenText) return
    setIsSpeaking(true)
    try {
      const res = await fetch('/api/edna/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText, voiceId: EDNA_VOICE_ID })
      })
      if (res.ok) {
        const audioBlob = await res.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.play()
          audioRef.current.onended = () => {
            setIsSpeaking(false)
            if (voiceMode) startListening()
          }
        }
      }
    } catch {
      setIsSpeaking(false)
    }
  }

  // Candidate speaks via Web Speech API
  function startListening() {
    if (!voiceMode || isSpeaking) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      const t = Array.from(event.results).map((r: any) => r[0].transcript).join('')
      setTranscript(t)
      if (event.results[event.results.length - 1].isFinal) {
        setTranscript('')
        setInput(t)
        handleVoiceSend(t)
      }
    }
    recognition.onend = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  function startTimer(duration: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(duration)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handlePhaseEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function startSession() {
    setStage('session')
    setPhase(1)

    // Setup camera and recording
    const stream = await setupCamera()
    if (stream) startRecording(stream)

    await loadPhaseOpener(1)
    startTimer(PHASES[0].duration)
  }

  async function loadPhaseOpener(phaseNum: number) {
    setLoading(true)
    try {
      const res = await fetch('/api/edna/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          candidateName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'there',
          phase: phaseNum,
          roleLevel
        })
      })
      const data = await res.json()
      const ednaMsg: Message = { role: 'assistant', content: data.message, timestamp: new Date() }
      setMessages([ednaMsg])
      await ednaSpeak(data.message)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    await handleSend(input.trim())
    setInput('')
  }

  async function handleVoiceSend(text: string) {
    await handleSend(text)
  }

  async function handleSend(text: string) {
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/edna/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          candidateName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'there',
          phase,
          roleLevel
        })
      })
      const data = await res.json()
      const ednaMsg: Message = { role: 'assistant', content: data.message, timestamp: new Date() }
      setMessages(prev => [...prev, ednaMsg])
      await ednaSpeak(data.message)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handlePhaseEnd() {
    const completed = [...allMessages, ...messages]
    setAllMessages(completed)
    if (phase === 1) {
      setPhase(2)
      setMessages([])
      await loadPhaseOpener(2)
      startTimer(PHASES[1].duration)
    } else {
      await generateScore(completed)
    }
  }

  async function generateScore(allMsgs: Message[]) {
    if (timerRef.current) clearInterval(timerRef.current)
    setScoring(true)
    setStage('score')

    // Stop recording and upload
    const videoUrl = await stopRecordingAndUpload()
    if (videoUrl) setRecordingUrl(videoUrl)

    // Stop camera
    streamRef.current?.getTracks().forEach(t => t.stop())

    try {
      const res = await fetch('/api/edna/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMsgs.map(m => ({ role: m.role, content: m.content })),
          candidateEmail: user?.email,
          candidateName: user?.user_metadata?.name || user?.email?.split('@')[0],
          roleLevel,
          recordingUrl: videoUrl
        })
      })
      const data = await res.json()
      setScores(data)
    } catch (e) {
      console.error(e)
    }
    setScoring(false)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timerColor = timeLeft < 60 ? '#DC2626' : timeLeft < 120 ? '#F97316' : '#15803D'
  const candidateName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  // WELCOME SCREEN
  if (stage === 'welcome') return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F0FB', fontFamily: 'Raleway,sans-serif' }}>
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          <span className="text-sm font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>N</span>
        </div>
        <span className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Naggare Score</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto w-full">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          👩‍💻
        </div>
        <h1 className="text-2xl font-bold text-center mb-1" style={{ color: '#1E1B4B', fontFamily: 'Georgia,serif' }}>Meet Edna</h1>
        <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>Your pair programming partner for today</p>

        <div className="bg-white rounded-3xl p-6 w-full mb-6 border border-gray-100 shadow-sm">
          <p className="text-sm font-semibold mb-4" style={{ color: '#1E1B4B' }}>What to expect:</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '💬', text: "Edna is a fellow engineer, not an examiner. Think of this as a working session with a colleague." },
              { icon: '🎤', text: "You can type or speak. Edna will respond in voice — warm, funny and human." },
              { icon: '📹', text: "Your session is recorded and attached to your Naggare profile. Recruiters you match with can view it." },
              { icon: '⏱', text: "Two phases: 8 min refactoring + 10 min system design. 18 minutes total." },
              { icon: '📊', text: "Your Naggare Score is generated at the end. Valid for 6 months across all recruiters." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full mb-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#4F46E5' }}>Select your role level</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_LEVELS.map(level => (
              <button key={level} onClick={() => setRoleLevel(level)}
                className="px-3 py-2 rounded-xl text-xs font-semibold border"
                style={{
                  background: roleLevel === level ? '#4F46E5' : 'white',
                  color: roleLevel === level ? 'white' : '#374151',
                  borderColor: roleLevel === level ? '#4F46E5' : '#E5E7EB'
                }}>
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Voice toggle */}
        <div className="w-full mb-6 flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Voice mode</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Edna speaks, you speak back</p>
          </div>
          <button onClick={() => setVoiceMode(!voiceMode)}
            className="w-12 h-6 rounded-full transition-colors relative"
            style={{ background: voiceMode ? '#4F46E5' : '#E5E7EB' }}>
            <div className="w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all"
              style={{ left: voiceMode ? '26px' : '2px' }} />
          </button>
        </div>

        <button onClick={() => setStage('consent')}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          Continue →
        </button>
      </div>
    </div>
  )

  // CONSENT SCREEN
  if (stage === 'consent') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F1F0FB', fontFamily: 'Raleway,sans-serif' }}>
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-sm">
        <div className="text-4xl text-center mb-4">📹</div>
        <h2 className="text-xl font-bold text-center mb-2" style={{ color: '#1E1B4B', fontFamily: 'Georgia,serif' }}>Recording consent</h2>
        <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>
          This session will be recorded — your video, audio and code will be captured and attached to your Naggare profile.
        </p>
        <div className="flex flex-col gap-2 mb-8 text-sm" style={{ color: '#374151' }}>
          {[
            'Recruiters you match with can view your session',
            'You can request deletion at any time',
            'Sessions are stored securely and never shared publicly',
            'Your score is generated from this session'
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span style={{ color: '#4F46E5' }}>✓</span>
              <p className="text-xs">{item}</p>
            </div>
          ))}
        </div>
        <button onClick={startSession}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white mb-3"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          I agree — start session with Edna
        </button>
        <button onClick={() => setStage('welcome')}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-500">
          Go back
        </button>
      </div>
    </div>
  )

  // SCORE SCREEN
  if (stage === 'score') return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F0FB', fontFamily: 'Raleway,sans-serif' }}>
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          <span className="text-sm font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>N</span>
        </div>
        <span className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Your Naggare Score</span>
      </div>

      <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        {scoring ? (
          <div className="flex flex-col items-center justify-center min-h-80 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-pulse" style={{ background: '#EEF2FF' }}>⏳</div>
            <p className="text-sm font-semibold" style={{ color: '#4F46E5' }}>Edna is reviewing the session...</p>
            <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>Saving your recording and generating your Naggare Score.</p>
          </div>
        ) : scores ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#C7D2FE' }}>Naggare Score · {roleLevel}</p>
              <p className="text-6xl font-bold text-white mb-1">{scores.overall_score}</p>
              <p className="text-sm" style={{ color: '#C7D2FE' }}>out of 100</p>
              <div className="mt-3 px-3 py-1 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <p className="text-xs font-semibold text-white">{scores.role_signal}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Refactoring</p>
                <p className="text-2xl font-bold" style={{ color: '#4F46E5' }}>{scores.refactoring_score}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">System Design</p>
                <p className="text-2xl font-bold" style={{ color: '#7C3AED' }}>{scores.design_score}</p>
              </div>
            </div>

            {recordingUrl && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4F46E5' }}>Session recording</p>
                <video src={recordingUrl} controls className="w-full rounded-xl" style={{ maxHeight: '200px' }} />
                <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Attached to your profile · Visible to matched recruiters</p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4F46E5' }}>Edna&apos;s summary</p>
              <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{scores.summary}</p>
            </div>

            {scores.strengths?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#15803D' }}>Strengths</p>
                {scores.strengths.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                    <p className="text-sm" style={{ color: '#374151' }}>{s}</p>
                  </div>
                ))}
              </div>
            )}

            {scores.watch_areas?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#C2410C' }}>Areas to explore</p>
                {scores.watch_areas.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="text-orange-400 flex-shrink-0 mt-0.5">→</span>
                    <p className="text-sm" style={{ color: '#374151' }}>{s}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl p-4 text-center" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <p className="text-xs" style={{ color: '#4F46E5' }}>✓ Your Naggare Score is now visible to all recruiters on the platform</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Valid for 6 months · Retake anytime to improve</p>
            </div>

            <button onClick={() => router.push('/home')}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              Back to home →
            </button>
          </div>
        ) : (
          <p className="text-sm text-center text-gray-500">Something went wrong. Please try again.</p>
        )}
      </div>
    </div>
  )

  // SESSION SCREEN
  const currentPhase = PHASES[phase - 1]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1E1B4B', fontFamily: 'Raleway,sans-serif' }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">👩‍💻</span>
          <div>
            <p className="text-sm font-bold text-white">Edna</p>
            <p className="text-xs" style={{ color: '#A5B4FC' }}>{currentPhase.name} · Phase {phase} of 2</p>
          </div>
          {isSpeaking && (
            <div className="flex gap-0.5 items-end ml-2">
              {[3,5,4,6,3].map((h,i) => (
                <div key={i} className="w-1 rounded-full animate-bounce" style={{ height: h*3+'px', background: '#A5B4FC', animationDelay: i*100+'ms' }} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold font-mono" style={{ color: timerColor }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <button onClick={handlePhaseEnd}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            {phase === 1 ? 'Next →' : 'Finish →'}
          </button>
        </div>
      </div>

      {/* Phase bar */}
      <div className="flex gap-0">
        {PHASES.map((p, i) => (
          <div key={i} className="flex-1 h-0.5" style={{
            background: i + 1 < phase ? '#4F46E5' : i + 1 === phase ? '#7C3AED' : 'rgba(255,255,255,0.2)'
          }} />
        ))}
      </div>

      {/* Main area - video + chat */}
      <div className="flex-1 flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>

        {/* Video feed - small PiP style */}
        {/* Video feed */}
        <div className="relative mx-4 mt-3 flex justify-end">
          <div className="relative">
            <video ref={videoRef} autoPlay muted playsInline
              style={{
                width: '120px',
                height: '90px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.3)',
                background: '#000',
                display: 'block'
              }} />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(0,0,0,0.8)' }}>
                <span className="text-2xl">📷</span>
              </div>
            )}
            {recording && (
              <div className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.9)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-bold">REC</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                  👩‍💻
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? '' : ''}`}
                style={{
                  background: msg.role === 'user' ? 'rgba(255,255,255,0.15)' : 'rgba(79,70,229,0.3)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                {msg.content.split(/(```[\s\S]*?```)/g).map((part: string, idx: number) => {
                  if (part.startsWith('```')) {
                    const code = part.replace(/```[\w]*\n?/, '').replace(/```$/, '')
                    return (
                      <pre key={idx} className="rounded-xl p-3 text-xs overflow-x-auto my-2"
                        style={{ background: '#0D0B1E', color: '#C7D2FE', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {code}
                      </pre>
                    )
                  }
                  return <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
                })}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>👩‍💻</div>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(79,70,229,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex gap-1">
                  {[0,150,300].map(delay => (
                    <div key={delay} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#A5B4FC', animationDelay: delay+'ms' }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          {transcript && (
            <div className="flex justify-end">
              <div className="rounded-2xl px-4 py-2 text-sm italic" style={{ background: 'rgba(255,255,255,0.1)', color: '#A5B4FC' }}>
                {transcript}...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {voiceMode ? (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking}
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all"
                style={{
                  background: isListening ? '#DC2626' : isSpeaking ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                  transform: isListening ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isListening ? '0 0 20px rgba(220,38,38,0.5)' : 'none'
                }}>
                {isListening ? '⏹' : isSpeaking ? '🔊' : '🎤'}
              </button>
              <p className="text-xs" style={{ color: '#A5B4FC' }}>
                {isSpeaking ? 'Edna is speaking...' : isListening ? 'Listening... tap to stop' : 'Tap to speak'}
              </p>
              <button onClick={() => setVoiceMode(false)} className="text-xs" style={{ color: '#6B7280' }}>
                Switch to text
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Type your response... (Shift+Enter for new line)"
                rows={2}
                className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'Raleway,sans-serif' }}
              />
              <div className="flex flex-col gap-1">
                <button onClick={sendMessage} disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : 'rgba(255,255,255,0.1)' }}>
                  ↑
                </button>
                {voiceMode === false && (
                  <button onClick={() => setVoiceMode(true)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    🎤
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
