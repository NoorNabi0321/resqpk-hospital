import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

// Placeholder dashboard — the full bento-grid UI arrives in Module 5.
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, hospital, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080D1A] text-white">
      <h1 className="text-2xl font-bold">Welcome, {hospital?.name ?? 'Hospital'}</h1>
      <p className="mt-2 text-gray-400">Logged in as: {user?.email ?? '—'}</p>
      <p className="mt-1 text-sm text-gray-500">Module 5 will add the full dashboard here</p>
      <button
        onClick={handleLogout}
        className="mt-6 rounded-lg bg-[#EF4444] px-6 py-2 font-medium text-white transition hover:bg-[#dc2626]"
      >
        Logout
      </button>
    </div>
  );
}
