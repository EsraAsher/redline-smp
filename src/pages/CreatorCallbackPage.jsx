import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCreatorAuth } from '../context/CreatorAuthContext';

const CreatorCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useCreatorAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/creator/login?error=${error}`, { replace: true });
      return;
    }

    if (token) {
      loginWithToken(token);
      navigate('/creator/dashboard', { replace: true });
    } else {
      navigate('/creator/login?error=token_failed', { replace: true });
    }
  }, [searchParams, navigate, loginWithToken]);

  return (
    <main className="relative z-10 pt-24 pb-20 px-4 max-w-md mx-auto min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-400 text-sm">Authenticating…</p>
      </div>
    </main>
  );
};

export default CreatorCallbackPage;
