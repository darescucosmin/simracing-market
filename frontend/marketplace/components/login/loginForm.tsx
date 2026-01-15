"use client";

import { useEffect, useState } from "react";
import "./style.css";
import Navbar from "../navbar/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";

type LoginData = {
  email: string;
  password: string;
};

type JwtPayload = {
  id: number;
  name: string;
  email: string;
  exp?: number;
  iat?: number;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const LoginForm = () => {
  const [loginForm, setLoginForm] = useState<boolean>(true);
  const searchParams = useSearchParams();

  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState<boolean>(false);

  // optional: dacă vii cu /login?mode=register (din homepage)
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register") setLoginForm(false);
  }, [searchParams]);

  const handleLoginStatus = () => {
    setLoginForm(!loginForm);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);

  
      try {
        const decoded = jwtDecode<JwtPayload>(data.token);
        if (decoded?.id) {
          localStorage.setItem("userId", String(decoded.id));
          localStorage.setItem("userName", decoded.name ?? "");
          localStorage.setItem("userEmail", decoded.email ?? "");
        }
      } catch {
       
      }

      toast.success("Login successful");

      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch {
      toast.error("Server unavailable");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Register failed");
        return;
      }

      toast.success("Account created successfully");
      setLoginForm(true);
    } catch {
      toast.error("Server unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
        {/* VIDEO BACKGROUND */}
          <video className="auth-bg-video" autoPlay muted loop playsInline>
            <source src="/driver-video.mp4" type="video/mp4" />
          </video>

      <div className="auth">
        {/* LEFT */}
        <section className="auth-left">
          <div className="auth-badge">SIM RACING MARKET</div>

          <h1 className="auth-title">
            Welcome <br /> back
          </h1>

          <p className="auth-subtitle">
            Bine ai venit! Autentifică-te cu contul tău pentru a avea acces complet
            la funcționalitățile aplicației.
          </p>

          <div className="auth-hints">
            <div className="hint">⚡ Fast checkout</div>
            <div className="hint">🛠️ Upgrade-uri reale</div>
            <div className="hint">🏁 Built for sim racers</div>
          </div>
        </section>

        {/* RIGHT (glass) */}
        <section className={`auth-right ${loginForm ? "mode-login" : "mode-register"}`}>
          <div className="auth-tabs">
            <button
              className={`tab ${loginForm ? "active" : ""}`}
              onClick={() => setLoginForm(true)}
              type="button"
            >
              Login
            </button>
            <button
              className={`tab ${!loginForm ? "active" : ""}`}
              onClick={() => setLoginForm(false)}
              type="button"
            >
              Register
            </button>
            <div className="tab-indicator" />
          </div>

          <div className="auth-forms">
            {/* LOGIN */}
            <div className="form-card form-login">
              <h2>Login</h2>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="email@exemplu.com"
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="••••••••"
                />
              </label>

              <button className="cta" onClick={handleLoginSubmit} disabled={loading}>
                <span>{loading ? "Loading..." : "Login"}</span>
                <i className="cta-glow" />
              </button>

              <p className="switch" onClick={handleLoginStatus}>
                Nu ai cont? <b>Creează unul</b> →
              </p>
            </div>

            {/* REGISTER */}
            <div className="form-card form-register">
              <h2>Register</h2>

              <label className="field">
                <span>Username</span>
                <input
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  placeholder="Numele tău"
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="email@exemplu.com"
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="••••••••"
                />
              </label>

              <label className="field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="••••••••"
                />
              </label>

              <button className="cta" onClick={handleRegisterSubmit} disabled={loading}>
                <span>{loading ? "Loading..." : "Register"}</span>
                <i className="cta-glow" />
              </button>

              <p className="switch" onClick={handleLoginStatus}>
                Ai deja cont? <b>Login</b> →
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginForm;
