import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "./context/AuthContext";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const Dashboard = lazy(() => import("./components/Dashboard"));

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-background)] px-6 text-sm text-[color:var(--color-muted-foreground)]">
    Loading...
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "rounded-none border border-[color:var(--color-primary)] bg-[color:var(--color-card)] text-[color:var(--color-foreground)] shadow-lg",
          descriptionClassName: "text-[color:var(--color-muted-foreground)]",
        }}
      />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Keep unknown routes flowing through the protected root instead of rendering a dead end. */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
