import { useAuth } from '../context/AuthContext'

function CheckSquareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M2.25 4.5A2.25 2.25 0 014.5 2.25h15a2.25 2.25 0 012.25 2.25v15a2.25 2.25 0 01-2.25 2.25h-15A2.25 2.25 0 012.25 19.5v-15zm12.53 4.72a.75.75 0 00-1.06-1.06L9 12.44l-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z" clipRule="evenodd" />
    </svg>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5 text-blue-600">
            <CheckSquareIcon />
            <span className="font-bold text-gray-900 text-lg">TaskFlow</span>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">AWS CI/CD</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
