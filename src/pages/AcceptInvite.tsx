import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizationService } from '../services/organizationService';
import AuthLayout from '../components/auth/AuthLayout';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, refreshOrganization } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login-required'>('loading');
  const [message, setMessage] = useState('');
  const [orgName, setOrgName] = useState('');

  const token = searchParams.get('token');

  const acceptInvitation = async () => {
    if (!token || !currentUser) return;

    try {
      setStatus('loading');
      const organizationId = await organizationService.acceptInvitation(
        token,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'User'
      );

      if (organizationId) {
        const org = await organizationService.getOrganization(organizationId);
        setOrgName(org?.name || 'the organization');
        await refreshOrganization();
        setStatus('success');
        setMessage(`You've successfully joined ${org?.name || 'the organization'}!`);
      } else {
        setStatus('error');
        setMessage('This invitation is invalid or has already been used.');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to accept invitation. Please try again.');
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link. No token provided.');
      return;
    }

    if (!currentUser) {
      setStatus('login-required');
      setMessage('Please log in or create an account to accept this invitation.');
      return;
    }

    acceptInvitation();
  }, [token, currentUser]);

  return (
    <AuthLayout title="Team Invitation" subtitle="Accept your invitation to join">
      <>
          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Processing your invitation...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to {orgName}!</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary w-full"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invitation Error</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link to="/dashboard" className="btn-secondary w-full inline-block text-center">
                Go to Dashboard
              </Link>
            </div>
          )}

          {status === 'login-required' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link 
                  to={`/login?redirect=/accept-invite?token=${token}`} 
                  className="btn-primary w-full inline-block text-center"
                >
                  Log In
                </Link>
                <Link 
                  to={`/signup?redirect=/accept-invite?token=${token}`} 
                  className="btn-secondary w-full inline-block text-center"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </>
    </AuthLayout>
  );
}
