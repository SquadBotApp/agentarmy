import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Spinner } from './Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// A full-page container for the spinner during initial auth check.
const FullPageSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#121212'
  }}>
    <Spinner size={60} thickness={5} />
  </div>
);

/**
 * A component that protects routes, ensuring only authenticated users can access them.
 * If the user is not authenticated, they are redirected to the login page.
 * It also displays a loading indicator while checking the authentication status.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const status = useUserStore((state) => state.status);

  // On initial load, status can be 'idle' or 'loading' while we check the token.
  // During this time, we show a loading spinner to prevent a flicker to the login page.
  if (status === 'loading' || status === 'idle') {
    return <FullPageSpinner />;
  }

  // If authenticated, render the requested component.
  if (status === 'authenticated') {
    return <>{children}</>;
  }

  // For 'unauthenticated' or 'error' status, redirect to login.
  // The `replace` prop avoids adding the login route to the history stack.
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;