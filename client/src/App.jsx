import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store/hooks';
import { selectLoading, selectUser } from './store/slices/authSlice';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import EditTask from './pages/EditTask';
import Users from './pages/Users';
import EditUser from './pages/EditUser';
import Notifications from './pages/Notifications';
import NotificationSettings from './pages/NotificationSettings';
import Profile from './pages/Profile';

function App() {
  const loading = useAppSelector(selectLoading);
  const user = useAppSelector(selectUser);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-cream">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Navbar />
                  <main className="flex-1 overflow-auto">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/tasks/create" element={<CreateTask />} />
                      <Route path="/tasks/:id/edit" element={<EditTask />} />
                      <Route path="/tasks/:id" element={<TaskDetail />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute requireManager>
                            <Users />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/users/:id/edit"
                        element={
                          <ProtectedRoute requireManager>
                            <EditUser />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/notification-settings"
                        element={
                          <ProtectedRoute requireManager>
                            <NotificationSettings />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

