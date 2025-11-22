import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddEnquiry from "./pages/AddEnquiry";
import ViewEnquiry from "./pages/ViewEnquiry";
//import SearchEnquiry from "./pages/SearchEnquiry";
import TodayFollowUps from "./pages/TodaysFollowUps";
import AllFollowUps from "./pages/AllFollowUps";
import ImportAdvertisement from "./pages/ImportAdvertisement";
import AdvertisementEnquiries from "./pages/AdvertisementEnquiries";
import SearchAdvertisementEnquiry from "./pages/SearchAdvertisementEnquiry";
import AdminProfile from "./pages/AdminProfile";
import UserManagement from "./pages/UserManagement";
import Unauthorized from "./pages/Unauthorized";
import PaymentDetails from "./pages/PaymentDetails";
import TestPasswordChange from "./pages/TestPasswordChange";

import ProtectedRoute from "./components/ProtectedRoute";
import { RoleBasedRoute } from "./components/Rolelayout";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";

/* ─────────────────────────────────────────────
   Layout wrapper: Sidebar + responsive content
─────────────────────────────────────────────── */
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar is responsible for its own responsive behavior */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <main
          className={`flex-1 transition-[margin] duration-300 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 ${
            isCollapsed ? "md:ml-20" : "md:ml-64"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Application
─────────────────────────────────────────────── */
function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            {/* ──────── PUBLIC ROUTES ──────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ──────── DEFAULT DASHBOARD ──────── */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* ──────── PERMISSION‑BASED ROUTES ──────── */}
            <Route
              path="/add-enquiry"
              element={
                <ProtectedRoute permission="Add Enquiry">
                  <AppLayout>
                    <AddEnquiry />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/view-enquiry"
              element={
                <ProtectedRoute permission="View Enquiry">
                  <AppLayout>
                    <ViewEnquiry />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment-details"
              element={
                <ProtectedRoute permission="Manage Payment Details">
                  <AppLayout>
                    <PaymentDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* <Route
              path="/search-enquiry"
              element={
                <ProtectedRoute permission="Search Enquiry">
                  <AppLayout>
                    <SearchEnquiry />
                  </AppLayout>
                </ProtectedRoute>
              }
            /> */}

            <Route
              path="/today-followups"
              element={
                <ProtectedRoute permission="Today's Follow-ups">
                  <AppLayout>
                    <TodayFollowUps />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/all-followups"
              element={
                <ProtectedRoute permission="All Follow-ups">
                  <AppLayout>
                    <AllFollowUps />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/import-advertisement"
              element={
                <ProtectedRoute permission="Import Advertisement">
                  <AppLayout>
                    <ImportAdvertisement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/advertisement-enquiries"
              element={
                <ProtectedRoute permission="View Advertisement Data">
                  <AppLayout>
                    <AdvertisementEnquiries />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/search-advertisement"
              element={
                <ProtectedRoute permission="Search Advertisement">
                  <AppLayout>
                    <SearchAdvertisementEnquiry />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* ──────── ADMIN‑ONLY ROUTES ──────── */}
            <Route
              path="/admin-profile"
              element={
                <RoleBasedRoute allowedRoles={["admin"]}>
                  <AppLayout>
                    <AdminProfile />
                  </AppLayout>
                </RoleBasedRoute>
              }
            />

            <Route
              path="/user-management"
              element={
                <RoleBasedRoute allowedRoles={["admin"]}>
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </RoleBasedRoute>
              }
            />

            <Route
              path="/test-password-change"
              element={
                <RoleBasedRoute allowedRoles={["admin"]}>
                  <AppLayout>
                    <TestPasswordChange />
                  </AppLayout>
                </RoleBasedRoute>
              }
            />

            {/* ──────── FALLBACK ──────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;