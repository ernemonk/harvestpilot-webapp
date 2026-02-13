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
    <AuthLayout title="Welcome back" subtitle="Sign in to your HarvestPilot account">
      <LoginForm onSubmit={handleSubmit} error={error} />

      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
