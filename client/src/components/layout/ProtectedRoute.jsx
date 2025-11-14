import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  selectUser,
  selectLoading,
  selectIsAdmin,
  selectIsManager,
} from '../../store/slices/authSlice';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children, requireAdmin = false, requireManager = false }) => {
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectLoading);
  const isAdmin = useAppSelector(selectIsAdmin);
  const isManager = useAppSelector(selectIsManager);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If requireManager is true, user must be manager or admin
  if (requireManager && !isManager && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If requireAdmin is true (and requireManager is false), user must be admin
  if (requireAdmin && !requireManager && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

