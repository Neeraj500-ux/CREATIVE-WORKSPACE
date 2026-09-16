import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  Layers,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { auth } from "../lib/firebase";
import { dashboardPath } from "../lib/permissions";
import { useWorkspace } from "../services/workspace";

function readableError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "Something went wrong. Please try again.";
  }
  const messages: Record<string, string> = {
    "auth/invalid-email": "Enter a valid work email address.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Check your internet connection and try again.",
    "auth/popup-blocked": "Allow popups in your browser and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/unauthorized-domain": "Add this website domain to Firebase authorized domains.",
    "auth/operation-not-allowed": "Enable this login method in Firebase Authentication.",
    "auth/account-exists-with-different-credential": "Use the sign-in method already linked to this email.",
  };
  return messages[error.code] ?? "Unable to complete the request. Try again.";
}

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.28-3.13.78-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

export default function Login() {
  const { user: workspaceUser, error: workspaceError, loading: checking, login, loginGoogle } = useWorkspace();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | "reset" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!checking && workspaceUser) {
    return <Navigate to={dashboardPath[workspaceUser.role] ?? "/"} replace />;
  }

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || checking) return;
    clearMessages();
    setBusy("email");
    try {
      await login(email, password);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    if (busy || checking) return;
    clearMessages();
    setBusy("google");
    try {
      await loginGoogle();
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    if (busy || checking) return;
    clearMessages();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter your work email first to reset your password.");
      return;
    }
    setBusy("reset");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("If an account exists, a password reset link will arrive in your inbox.");
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(null);
    }
  };

  const disabled = busy !== null || checking;
  return (
    <main className="auth-screen" aria-busy={checking}>
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-shell">
        <section className="auth-story">
          <div className="auth-brand"><span className="auth-brand-icon"><Layers size={23} /></span><div><strong>creative-crew</strong><small>CREATIVE WORKSPACE</small></div></div>
          <div className="auth-story-copy">
            <span className="auth-pill"><Sparkles size={13} /> PLAN · CREATE · GROW</span>
            <h1>Where great work finds its <em>flow.</em></h1>
            <p>Bring people, projects and progress together in one calm, focused workspace built for creative teams.</p>
            <div className="auth-benefits"><span><Check size={15} /> Clear priorities</span><span><Check size={15} /> Better teamwork</span><span><Check size={15} /> Meaningful progress</span></div>
          </div>
          <div className="auth-story-bottom"><span className="auth-mini-stat"><Users size={16} /><strong>One connected team</strong></span><span className="auth-mini-stat"><BarChart3 size={16} /><strong>Work with direction</strong></span></div>
        </section>

        <section className="auth-panel" aria-labelledby="login-title">
          <div className="auth-secure"><ShieldCheck size={16} /> Secure Firebase workspace access</div>
          <div className="auth-form-wrap">
            <div className="auth-welcome-icon"><Layers size={27} /></div>
            <span className="auth-eyebrow">WELCOME BACK</span>
            <h2 id="login-title">Let&apos;s get creating<span>.</span></h2>
            <p className="auth-description">Sign in to continue to your role-based workspace.</p>
            {checking && <div className="auth-status" role="status"><LoaderCircle size={17} className="spin" /> Preparing your workspace…</div>}
            {(error || workspaceError) && <div className="auth-message auth-error" role="alert">{error || workspaceError}</div>}
            {success && <div className="auth-message auth-success" role="status">{success}</div>}

            <button className="google-button" type="button" onClick={() => void handleGoogle()} disabled={disabled}><span>{busy === "google" ? <LoaderCircle size={19} className="spin" /> : <GoogleMark />}</span>{busy === "google" ? "Connecting to Google…" : "Continue with Google"}</button>
            <div className="auth-divider"><span>or continue with email</span></div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="login-email">Work email</label>
              <div className="auth-input"><Mail size={18} /><input id="login-email" type="email" autoComplete="username" inputMode="email" placeholder="you@company.com" value={email} onChange={(event) => { setEmail(event.target.value); clearMessages(); }} disabled={disabled} required /></div>
              <div className="auth-password-label"><label htmlFor="login-password">Password</label><button type="button" onClick={() => void handleReset()} disabled={disabled}>{busy === "reset" ? "Sending…" : "Forgot password?"}</button></div>
              <div className="auth-input"><LockKeyhole size={18} /><input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); clearMessages(); }} disabled={disabled} required /><button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} disabled={disabled} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              <button className="auth-submit" type="submit" disabled={disabled}><span>{busy === "email" || checking ? <LoaderCircle size={17} className="spin" /> : null}{checking ? "Preparing workspace…" : busy === "email" ? "Signing in…" : "Enter your workspace"}</span><ArrowRight size={18} /></button>
            </form>
            <p className="auth-trust"><ShieldCheck size={14} /> Your identity is protected by Firebase Authentication.</p>
            <p className="auth-help">Need an account? Contact your workspace administrator.</p>
          </div>
          <footer className="auth-footer">© {new Date().getFullYear()} creative-crew <span>Built for focused teams.</span></footer>
        </section>
      </div>
    </main>
  );
}
