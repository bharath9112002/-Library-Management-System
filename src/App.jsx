import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import ToastProvider from './context/ToastProvider'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import ComingSoon from './pages/ComingSoon'
import BookList from './pages/books/BookList'
import BookDetails from './pages/books/BookDetails'
import BookFormPage from './pages/books/BookForm'
import MemberList from './pages/members/MemberList'
import MemberProfile from './pages/members/MemberProfile'
import MemberFormPage from './pages/members/MemberForm'
import IssueReturn from './pages/issues/IssueReturn'
import Fines from './pages/fines/Fines'
import Categories from './pages/categories/Categories'
import Search from './pages/Search'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/books" element={<BookList />} />
                <Route path="/books/new" element={<BookFormPage />} />
                <Route path="/books/:id" element={<BookDetails />} />
                <Route path="/books/:id/edit" element={<BookFormPage />} />
                <Route path="/members" element={<MemberList />} />
                <Route path="/members/new" element={<MemberFormPage />} />
                <Route path="/members/:id" element={<MemberProfile />} />
                <Route path="/members/:id/edit" element={<MemberFormPage />} />
                <Route path="/issues" element={<IssueReturn />} />
                <Route path="/fines" element={<Fines />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/search" element={<Search />} />
                <Route path="/reports" element={<ComingSoon title="Reports" />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
