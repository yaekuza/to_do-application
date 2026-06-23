import { Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppShell from './components/AppShell.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/account" element={<Navigate to="/settings?tab=account" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
