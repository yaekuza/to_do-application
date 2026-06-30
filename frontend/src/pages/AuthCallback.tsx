import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    navigate(session ? '/calendar' : '/login', { replace: true });
  }, [loading, session, navigate]);

  return <div className="boot">signing you in…</div>;
}
