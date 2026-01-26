import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import FarmDashboard from './pages/FarmDashboard'
import FarmModule from './pages/FarmModule'
import Dashboard from './pages/Dashboard'
import Device from './pages/Device'
import DeviceSetup from './pages/DeviceSetup'
import Alerts from './pages/Alerts'
import Crops from './pages/Crops'
import Harvests from './pages/Harvests'
import Customers from './pages/Customers'
import Fields from './pages/Fields'
import CropResearch from './pages/CropResearch'
import CropResearchDetail from './pages/CropResearchDetail'
import Team from './pages/Team'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import AcceptInvite from './pages/AcceptInvite'
import PrivateRoute from './components/PrivateRoute'
import { useAuth } from './contexts/AuthContext'
import { usePermissions } from './hooks/usePermissions'

function App() {
  const { currentUser, logout, currentOrganization, allOrganizations, switchOrganization } = useAuth()
  const { canManageTeam, getRoleName, getRoleBadgeColor, userRole } = usePermissions()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  async function handleLogout() {
    try {
      await logout()
      setShowUserMenu(false)
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out', error)
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
      isActive
        ? 'border-primary-500 text-gray-900'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 border-primary-500 text-primary-700'
        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <NavLink to="/" className="flex items-center space-x-2">
                  <span className="text-2xl sm:text-3xl">🌱</span>
                  <div className="flex flex-col">
                    <h1 className="text-sm sm:text-xl font-bold text-primary-600 leading-tight">Farm Intelligence</h1>
                    <p className="text-xs text-gray-500 leading-tight hidden sm:block">Harvest Hub</p>
                  </div>
                </NavLink>
              </div>
              {currentUser && (
                <div className="hidden md:ml-8 md:flex md:space-x-8">
                  <NavLink to="/" end className={navLinkClass}>
                    Farm
                  </NavLink>
                  <NavLink to="/crops" className={navLinkClass}>
                    Crops
                  </NavLink>
                  <NavLink to="/harvests" className={navLinkClass}>
                    Harvests
                  </NavLink>
                  <NavLink to="/crop-research" className={navLinkClass}>
                    Research
                  </NavLink>
                  <NavLink to="/alerts" className={navLinkClass}>
                    Alerts
                  </NavLink>
                </div>
              )}
            </div>
            <div className="flex items-center">
              {currentUser ? (
                <>
                  {/* Mobile menu button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  >
                    <span className="sr-only">Open main menu</span>
                    {mobileMenuOpen ? (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>

                  {/* Desktop user menu */}
                  <div className="hidden md:block relative ml-3" ref={menuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-3 py-2 transition-colors"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-semibold">
                        {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="max-w-[150px] truncate">
                          {currentUser.displayName || currentUser.email}
                        </span>
                        {userRole && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(userRole)}`}>
                            {getRoleName(userRole)}
                          </span>
                        )}
                      </div>
                      <svg className={`h-5 w-5 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-500">Signed in as</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {currentUser.email}
                          </p>
                        </div>
                        
                        {/* Organization Switcher */}
                        {allOrganizations.length > 0 && (
                          <div className="py-2">
                            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                              {allOrganizations.length > 1 ? 'Your Teams' : 'Current Team'}
                            </p>
                            {allOrganizations.map((org) => (
                              <button
                                key={org.id}
                                onClick={() => {
                                  switchOrganization(org.id);
                                  setShowUserMenu(false);
                                }}
                                className={`flex items-center w-full text-left px-4 py-2 text-sm transition-colors ${
                                  currentOrganization?.id === org.id
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span className="flex items-center justify-center h-6 w-6 rounded bg-primary-100 text-primary-700 text-xs font-semibold mr-3">
                                  {org.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="truncate flex-1">{org.name}</span>
                                {currentOrganization?.id === org.id && (
                                  <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="py-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <NavLink to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    Sign In
                  </NavLink>
                  <NavLink to="/signup" className="btn-primary">
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {currentUser && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              <NavLink to="/" end className={mobileNavLinkClass}>
                Farm Dashboard
              </NavLink>
              <NavLink to="/crops" className={mobileNavLinkClass}>
                Crops
              </NavLink>
              <NavLink to="/harvests" className={mobileNavLinkClass}>
                Harvests
              </NavLink>
              <NavLink to="/crop-research" className={mobileNavLinkClass}>
                Research
              </NavLink>
              <NavLink to="/alerts" className={mobileNavLinkClass}>
                Alerts
              </NavLink>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500 truncate">
                    {currentUser.email}
                  </div>
                  {userRole && (
                    <span className={`inline-flex text-xs px-2 py-1 rounded-full mt-1 ${getRoleBadgeColor(userRole)}`}>
                      {getRoleName(userRole)}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-700 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16 py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/" element={<PrivateRoute><FarmDashboard /></PrivateRoute>} />
          <Route path="/farm-module/:moduleId" element={<PrivateRoute><FarmModule /></PrivateRoute>} />
          <Route path="/device" element={<PrivateRoute><Device /></PrivateRoute>} />
          <Route path="/device/setup" element={<PrivateRoute><DeviceSetup /></PrivateRoute>} />
          <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
          <Route path="/crops" element={<PrivateRoute><Crops /></PrivateRoute>} />
          <Route path="/harvests" element={<PrivateRoute><Harvests /></PrivateRoute>} />
          <Route path="/crop-research" element={<PrivateRoute><CropResearch /></PrivateRoute>} />
          <Route path="/crop-research/:id" element={<PrivateRoute><CropResearchDetail /></PrivateRoute>} />
          {/* Legacy routes - keep for backward compatibility */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/fields" element={<PrivateRoute><Fields /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App