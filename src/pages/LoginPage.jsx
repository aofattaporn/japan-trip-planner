import { supabase } from '../lib/supabase'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8H6.4C9.8 35.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C36.9 40 44 35 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  )
}

export default function LoginPage() {
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Hero */}
        <div className="bg-red-600 px-8 py-10 text-center text-white">
          <div className="text-6xl mb-3">🗾</div>
          <h1 className="text-2xl font-bold tracking-tight">Japan Trip Planner</h1>
          <p className="text-red-200 text-sm mt-1">Plan your perfect Japan adventure</p>
        </div>

        {/* Sign-in */}
        <div className="px-8 py-8">
          <p className="text-center text-gray-500 text-sm mb-6">Sign in to start planning</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 active:bg-gray-100 transition font-medium text-gray-700 shadow-sm"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <p className="text-center text-xs text-gray-400 mt-6">
            Your trips are private and only visible to you.
          </p>
        </div>
      </div>
    </div>
  )
}
