import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./modules/dashboard/Dashboard";
import LandingPage from "./modules/dashboard/LandingPage";
import { useAuthStore } from "./store/authStore";
import { Toaster } from "react-hot-toast";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuthStore();
    return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const App = () => {
    return (
        <Router>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#1e1e2d",
                        color: "#fff",
                        borderRadius: "24px",
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "500",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                        maxWidth: "400px",
                    },
                    success: {
                        iconTheme: {
                            primary: "#10b981",
                            secondary: "#fff",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "#ef4444",
                            secondary: "#fff",
                        },
                    },
                }}
            />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route
                    path="/dashboard/*"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

export default App;
