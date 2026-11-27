import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_TOKEN_KEY } from '@/lib/constants';
import { decodeValidToken } from '@/lib/auth-token';

export default function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
      // Preserve the full target (path + query) so flows that carry state in the
      // query string survive the sign-in round-trip.
      const target = encodeURIComponent(`${location.pathname}${location.search}`);

      if (decodeValidToken(localStorage.getItem(APP_TOKEN_KEY))) {
        setIsAuthenticated(true);
        return;
      }

      localStorage.removeItem(APP_TOKEN_KEY);
      navigate(`/sign_in?redirect=${target}`);
    }, [navigate, location.pathname, location.search]);

    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };
}
