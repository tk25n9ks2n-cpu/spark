import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../services/api';
import { Heart } from 'lucide-react';
export const AuthPage = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = isLogin
                ? await api.login(email, password)
                : await api.signup(name, email, password);
            localStorage.setItem('token', data.token);
            onLoginSuccess(data.token, data.user);
        }
        catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('failed to fetch') ||
                msg.toLowerCase().includes('networkerror') ||
                msg.toLowerCase().includes('network request failed') ||
                msg.toLowerCase().includes('load failed')) {
                setError('Cannot reach the server. Make sure the backend is running and you are on the same network.');
            }
            else {
                setError(msg || 'Something went wrong. Please try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "auth-shell", children: [_jsxs("div", { className: "auth-frame", children: [_jsx("div", { className: "auth-orb auth-orb-1" }), _jsx("div", { className: "auth-orb auth-orb-2" }), _jsxs("div", { className: "auth-brand", children: [_jsx("div", { className: "anim-float auth-logo-wrap", children: _jsx("div", { className: "auth-logo-ring", children: _jsx("div", { className: "auth-logo", children: _jsx("img", { src: "/logo.png", alt: "Spark", className: "auth-logo-img" }) }) }) }), _jsx("h1", { className: "auth-title", children: "spark" }), _jsxs("p", { className: "auth-tagline", children: ["Connect \u00B7 Share \u00B7 Meet ", _jsx(Heart, { size: 14, fill: "currentColor", color: "currentColor" })] })] }), _jsxs("div", { className: "animate-fade-up auth-card", children: [_jsx("div", { className: "auth-toggle", children: ['Log In', 'Sign Up'].map((label, i) => (_jsx("button", { onClick: () => { setIsLogin(i === 0); setError(''); }, className: `auth-toggle-btn ${(isLogin ? i === 0 : i === 1) ? 'active' : ''}`, children: label }, label))) }), _jsxs("form", { onSubmit: handleSubmit, className: "auth-form", children: [!isLogin && (_jsxs("div", { className: "animate-fade-up", style: { position: 'relative' }, children: [_jsx("span", { className: "auth-input-icon", children: "\uD83D\uDC64" }), _jsx("input", { className: "input-dark", type: "text", placeholder: "Full name", value: name, onChange: e => setName(e.target.value), style: { paddingLeft: 46 }, required: true })] })), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("span", { className: "auth-input-icon", children: "\u2709\uFE0F" }), _jsx("input", { className: "input-dark", type: "email", placeholder: "Email address", value: email, onChange: e => setEmail(e.target.value), style: { paddingLeft: 46 }, required: true })] }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("span", { className: "auth-input-icon", children: "\uD83D\uDD12" }), _jsx("input", { className: "input-dark", type: showPass ? 'text' : 'password', placeholder: "Password", value: password, onChange: e => setPassword(e.target.value), style: { paddingLeft: 46, paddingRight: 46 }, required: true }), _jsx("button", { type: "button", onClick: () => setShowPass(s => !s), className: "auth-eye-btn", children: showPass ? '🙈' : '👁️' })] }), error && (_jsxs("div", { className: "animate-fade-up auth-error", children: ["\u26A0\uFE0F ", error] })), _jsx("button", { className: "btn-flame", type: "submit", disabled: loading, style: {
                                            padding: '16px 0', fontSize: 16, marginTop: 6,
                                            opacity: loading ? 0.7 : 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        }, children: loading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner" }), isLogin ? 'Signing in...' : 'Creating account...'] })) : (isLogin ? '🔥 Sign In' : '✨ Create Account') })] }), _jsxs("p", { className: "auth-legal", children: ["By continuing you agree to our", ' ', _jsx("span", { style: { color: 'rgba(255,68,88,0.8)', cursor: 'pointer' }, children: "Terms" }), " &", ' ', _jsx("span", { style: { color: 'rgba(255,68,88,0.8)', cursor: 'pointer' }, children: "Privacy Policy" })] })] })] }), _jsx("style", { children: `
        /* ===== KEYFRAMES ===== */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(255,68,88,0.3); }
          50% { box-shadow: 0 4px 35px rgba(255,68,88,0.55); }
        }

        /* ===== SHELL: fills the viewport, centers the frame on wide screens ===== */
        .auth-shell {
          min-height: 100dvh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: stretch;
          background: #0a0a0d;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ===== FRAME: the actual mobile-styled surface. Full-bleed on phones,
           becomes a capped, centered card with its own edges once there's
           room to spare. ===== */
        .auth-frame {
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 480px;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(160deg, #0f0f13 0%, #1a0a10 50%, #0f0f13 100%);
        }

        @media (min-width: 640px) {
          .auth-frame {
            min-height: min(860px, 92dvh);
            margin: 4dvh 0;
            border-radius: 32px;
            box-shadow: 0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06);
          }
        }

        .auth-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .auth-orb-1 {
          top: -20%;
          left: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,68,88,0.15) 0%, transparent 70%);
        }
        .auth-orb-2 {
          bottom: -10%;
          right: -10%;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%);
        }

        /* ===== BRAND AREA ===== */
        .auth-brand {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(36px, 8dvh, 60px) 16px 24px;
          text-align: center;
        }

        .auth-logo-wrap { margin-bottom: 20px; }

        @keyframes ringPulse {
          0%, 100% {
            box-shadow:
              0 0 0 0px rgba(255, 107, 107, 0.6),
              0 0 30px rgba(255, 107, 107, 0.25);
          }
          50% {
            box-shadow:
              0 0 0 10px rgba(255, 107, 107, 0),
              0 0 55px rgba(255, 150, 80, 0.45);
          }
        }

        .auth-logo-ring {
          width: clamp(90px, 22vw, 108px);
          height: clamp(90px, 22vw, 108px);
          border-radius: 34px;
          background: linear-gradient(135deg, rgba(255,107,107,0.18), rgba(255,140,100,0.10));
          border: 1.5px solid rgba(255, 120, 80, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ringPulse 2.8s ease-in-out infinite;
          backdrop-filter: blur(8px);
        }

        .auth-logo {
          width: clamp(70px, 18vw, 86px);
          height: clamp(70px, 18vw, 86px);
          border-radius: 26px;
          background: radial-gradient(circle at 35% 30%, rgba(255,200,160,0.15), transparent 60%),
                      linear-gradient(145deg, #2a1018, #1a0a0e);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(232, 68, 90, 0.5),
            0 2px 8px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .auth-logo-img {
          width: 82%;
          height: 82%;
          object-fit: contain;
          filter: drop-shadow(0 4px 12px rgba(255, 100, 80, 0.6));
          border-radius: 4px;
        }

        .auth-title {
          font-size: clamp(30px, 8vw, 36px);
          font-weight: 900;
          margin: 0;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #E8445A, #F97F68);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-tagline {
          color: rgba(255,255,255,0.4);
          font-size: 14px;
          margin-top: 6px;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ===== CARD ===== */
        .auth-card {
          margin: 0 16px 32px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: clamp(24px, 5vw, 32px) clamp(18px, 5vw, 24px);
          backdrop-filter: blur(20px);
        }

        .auth-toggle {
          display: flex;
          background: rgba(255,255,255,0.06);
          border-radius: 50px;
          padding: 4px;
          margin-bottom: 28px;
        }

        .auth-toggle-btn {
          flex: 1;
          padding: 10px 0;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: transparent;
          color: rgba(255,255,255,0.4);
          transition: all 0.3s;
        }

        .auth-toggle-btn.active {
          background: linear-gradient(135deg, #FF4458, #FF6B35);
          color: white;
          box-shadow: 0 2px 12px rgba(255,68,88,0.3);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .auth-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          pointer-events: none;
          z-index: 1;
        }

        .auth-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
        }

        .auth-error {
          background: rgba(255,68,88,0.12);
          border: 1px solid rgba(255,68,88,0.3);
          border-radius: 12px;
          padding: 10px 14px;
          color: #FF6B7A;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auth-legal {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          line-height: 1.5;
        }

        /* ===== FLOATING LOGO ===== */
        .anim-float {
          animation: float 3s ease-in-out infinite;
        }

        /* ===== FADE UP ENTRANCE ===== */
        .animate-fade-up {
          animation: fadeUp 0.5s ease-out both;
        }

        /* ===== DARK INPUTS ===== */
        .input-dark {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #ffffff;
          font-size: 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .input-dark::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .input-dark:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .input-dark:focus {
          border-color: #E8445A;
          background: rgba(232, 68, 90, 0.06);
          box-shadow: 0 0 0 3px rgba(232, 68, 90, 0.15);
        }

        /* ===== FLAME BUTTON ===== */
        .btn-flame {
          width: 100%;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #FF4458, #FF6B35);
          color: white;
          font-weight: 700;
          font-size: 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          animation: pulseGlow 2.5s ease-in-out infinite;
        }

        .btn-flame::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
          border-radius: 14px;
        }

        .btn-flame:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(255, 68, 88, 0.45);
        }

        .btn-flame:active:not(:disabled) {
          transform: translateY(0px) scale(0.98);
          box-shadow: 0 2px 10px rgba(255, 68, 88, 0.3);
        }

        .btn-flame:disabled {
          cursor: not-allowed;
          animation: none;
        }

        /* ===== SPINNER ===== */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
        }

        /* ===== SCROLLBAR ===== */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
      ` })] }));
};
//# sourceMappingURL=AuthPage.js.map