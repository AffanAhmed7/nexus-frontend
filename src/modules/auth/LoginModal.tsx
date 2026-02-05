import React, { useState } from "react";
import { Mail, Lock, LogIn, X } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, signInWithPopup } from "../../utils/firebase";
import api from "../../utils/api.js";
import { useAuthStore } from "../../store/authStore.js";
import "../../styles/LoginModal.css";

interface Props {
  onClose: () => void;
}

const LoginModal: React.FC<Props> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Backend login (previously in your LoginPage)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      setLoading(false);
      onClose();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  // Google login (Firebase)
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      const response = await api.post("/auth/google", { token });
      const { user, accessToken, refreshToken } = response.data;

      setAuth(user, accessToken, refreshToken);
      setLoading(false);
      onClose();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Google Sign-In failed");
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <h2>Welcome Back</h2>
        <p>Sign in to your Nexus account</p>

        {error && <div className="login-modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <Mail size={18} className="login-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <Lock size={18} className="login-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in..." : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <div className="login-divider"><span>OR</span></div>

        <button className="btn btn-google" onClick={handleGoogleSignIn} disabled={loading}>
          <FcGoogle size={18} /> Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
