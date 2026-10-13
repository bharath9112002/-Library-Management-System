import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../context/useAuth'

// Keeps logged-in users away from login/register/forgot-password pages.
export default function GuestRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}
