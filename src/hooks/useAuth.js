import useAuthStore from '../stores/authStore';

// Convenience hook re-exporting the auth store.
export default function useAuth() {
  return useAuthStore();
}
