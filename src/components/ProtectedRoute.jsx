import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'

// Only lets authenticated users through; remembers where they were headed.
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
