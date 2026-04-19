import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import JobMatchPage from "./pages/JobMatch";
import CareerInsights from "./pages/CareerInsights";
import Affiliate from "./pages/Affiliate";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback";
import "./App.css";

// Synchronous detection of Emergent OAuth callback BEFORE normal routing.
// This avoids race conditions where ProtectedRoute runs before session_id
// is exchanged for a session cookie.
function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/affiliate" element={<Affiliate />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/results/:id/job-match" element={<ProtectedRoute><JobMatchPage /></ProtectedRoute>} />
      <Route path="/results/:id/insights" element={<ProtectedRoute><CareerInsights /></ProtectedRoute>} />
      <Route path="/affiliate/dashboard" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </div>
  );
}

export default App;
