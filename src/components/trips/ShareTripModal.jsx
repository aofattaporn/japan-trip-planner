import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { XIcon, CopyIcon, CheckIcon, Share2Icon } from 'lucide-react'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function ShareTripModal({ trip, onClose, onCodeGenerated }) {
  const [shareCode, setShareCode] = useState(trip.share_code || '')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = shareCode
    ? `${window.location.origin}${import.meta.env.BASE_URL}join/${shareCode}`
    : ''

  async function generate() {
    setGenerating(true)
    const code = generateCode()
    const { error } = await supabase.from('trips').update({ share_code: code }).eq('id', trip.id)
    if (!error) {
      setShareCode(code)
      onCodeGenerated(code)
    }
    setGenerating(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Share Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {shareCode ? (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Share code</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center">
                  <span className="font-mono text-2xl font-bold tracking-[0.25em] text-gray-800">
                    {shareCode}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1.5">Or share this link</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50 truncate"
                  />
                  <button
                    onClick={copyLink}
                    className="shrink-0 flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
                  >
                    {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Anyone with this link can join and edit this trip.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 text-center">
                Generate a share link so another user can join and collaborate on this trip.
              </p>
              <button
                onClick={generate}
                disabled={generating}
                className="flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                <Share2Icon size={16} />
                {generating ? 'Generating…' : 'Generate share link'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
