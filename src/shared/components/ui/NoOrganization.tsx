import { useAuth } from '../../contexts/AuthContext';

export default function NoOrganization() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="text-center py-12 max-w-md mx-auto">
        <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Organization Found</h2>
        <p className="text-gray-500 mb-4">
          Your account is not associated with any organization. This can happen if:
        </p>
        <ul className="text-sm text-gray-500 mb-6 text-left list-disc pl-6 space-y-1">
          <li>Your account was created without an organization</li>
          <li>Your organization membership was removed</li>
          <li>There was an error during signup</li>
        </ul>
        {currentUser && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-4">
              Logged in as: <strong>{currentUser.email}</strong>
            </p>
            <div className="space-x-3">
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                Sign Out
              </button>
              <a
                href="/signup"
                className="btn btn-primary"
              >
                Create New Account
              </a>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-6">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
