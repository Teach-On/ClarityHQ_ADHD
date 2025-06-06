import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, signInWithGoogle, resendConfirmationEmail } from '../services/auth';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import ErrorMessage from '../components/common/ErrorMessage';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailResendSuccess, setEmailResendSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('recovery') === 'needed') {
      setError('Your session has expired or encountered an error. Please sign in again.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNeedsEmailConfirmation(false);
    setEmailResendSuccess(false);
    setIsLoading(true);

    try {
      const { user, error, errorCode } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        if (errorCode === 'invalid_credentials') {
          throw new Error('Invalid email or password. Please try again.');
        } else if (errorCode === 'email_not_confirmed') {
          setNeedsEmailConfirmation(true);
          throw new Error('Please confirm your email before signing in.');
        } else {
          throw error;
        }
      }

      if (user) {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email || isResendingEmail) return;

    setIsResendingEmail(true);
    try {
      const { error } = await resendConfirmationEmail(email);

      if (error) throw error;

      setEmailResendSuccess(true);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend confirmation email.');
      }
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during Google sign-in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-1 flex-col justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">ClarityHQ</h1>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {error && <ErrorMessage message={error} />}

          {needsEmailConfirmation && (
            <div className="mb-4">
              <button
                onClick={handleResendConfirmation}
                disabled={isResendingEmail}
                className="text-sm text-blue-600 hover:underline"
              >
                {isResendingEmail ? 'Sending...' : 'Resend confirmation email'}
              </button>
            </div>
          )}

          {emailResendSuccess && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700"
            >
              Confirmation email sent! Please check your inbox.
            </motion.div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="btn btn-outline w-full"
          >
            Continue with Google
          </button>

          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input mt-1"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
