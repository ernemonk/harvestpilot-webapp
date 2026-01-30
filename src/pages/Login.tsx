import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(email: string, password: string) {
    try {
      setError('');
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
      throw err;
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Sign in to your account">
      <LoginForm onSubmit={handleSubmit} error={error} />

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-500 font-medium">Don't have an account?</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/signup"
            className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-200 rounded-lg shadow-sm bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-primary-300 transition-all"
          >
            Create new account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
