import React, { useState } from "react";
import { Mail, Lock, User, UserPlus, X } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api.js";
import { useAuthStore } from "../../store/authStore.js";
import { auth, googleProvider, signInWithPopup } from "../../utils/firebase";
import "../../styles/RegisterModal.css";

interface Props {
  onClose: () => void;
}

const RegisterModal: React.FC<Props> = ({ onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // ✅ NORMAL DB REGISTER (UNCHANGED LOGIC)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);

      onClose();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ GOOGLE SIGN-UP (FIREBASE ONLY)
  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      const response = await api.post("/auth/google", { token });
      const { user, accessToken, refreshToken } = response.data;

      setAuth(user, accessToken, refreshToken);
      onClose();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-modal-backdrop" onClick={onClose}>
      <div className="register-modal" onClick={(e) => e.stopPropagation()}>
        <button className="register-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>Create Account</h2>
        <p>Start your journey with Nexus</p>

        {error && <div className="register-modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="register-field">
            <User size={18} />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating account..." : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="register-divider">
          <span>OR</span>
        </div>

        <button
          className="btn btn-google"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <FcGoogle size={18} /> Sign up with Google
        </button>
      </div>
    </div>
  );
};

export default RegisterModal;
