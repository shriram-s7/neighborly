import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { RoleRoute } from './components/layout/RoleRoute';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ProviderProfilePage } from './pages/public/ProviderProfilePage';
import { RequesterDashboard } from './pages/requester/RequesterDashboard';
import { DiscoverPage } from './pages/requester/DiscoverPage';
import { MyBookingsPage } from './pages/requester/MyBookingsPage';
import { CreateBookingPage } from './pages/requester/CreateBookingPage';
import { BookingDetailPage } from './pages/requester/BookingDetailPage';
import { WalletPage } from './pages/requester/WalletPage';
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { ManageListingsPage } from './pages/provider/ManageListingsPage';
import { AvailabilityEditorPage } from './pages/provider/AvailabilityEditorPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { BarterBoardPage } from './pages/public/BarterBoardPage';
import { SmartRequestPage } from './pages/requester/SmartRequestPage';
import { Role } from '@neighborly/shared';

// Root redirector based on authentication and active role
const HomeRoute: React.FC = () => {
  const { user, loading, isProviderMode } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading Neighborly...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (user.role === Role.ADMIN) {
    return <AdminDashboard />;
  }

  if (isProviderMode) {
    return <ProviderDashboard />;
  }

  return <RequesterDashboard />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public routes */}
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/providers/:id" element={<ProviderProfilePage />} />

            {/* Authenticated Resident / Requester routes */}
            <Route
              path="/discover"
              element={
                <RoleRoute>
                  <DiscoverPage />
                </RoleRoute>
              }
            />
            <Route
              path="/request/smart"
              element={
                <RoleRoute>
                  <SmartRequestPage />
                </RoleRoute>
              }
            />
            <Route
              path="/smart-request"
              element={
                <RoleRoute>
                  <SmartRequestPage />
                </RoleRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <RoleRoute>
                  <MyBookingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/bookings/create"
              element={
                <RoleRoute>
                  <CreateBookingPage />
                </RoleRoute>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <RoleRoute>
                  <BookingDetailPage />
                </RoleRoute>
              }
            />
            <Route
              path="/free-help"
              element={
                <RoleRoute>
                  <RequesterDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/barter"
              element={
                <RoleRoute>
                  <BarterBoardPage />
                </RoleRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <RoleRoute>
                  <WalletPage />
                </RoleRoute>
              }
            />

            {/* Provider routes */}
            <Route
              path="/provider"
              element={
                <RoleRoute>
                  <ProviderDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/provider/listings"
              element={
                <RoleRoute>
                  <ManageListingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/provider/availability"
              element={
                <RoleRoute>
                  <AvailabilityEditorPage />
                </RoleRoute>
              }
            />
            <Route
              path="/provider/jobs"
              element={
                <RoleRoute>
                  <MyBookingsPage />
                </RoleRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={[Role.ADMIN]}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RoleRoute allowedRoles={[Role.ADMIN]}>
                  <AdminAnalyticsPage />
                </RoleRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
