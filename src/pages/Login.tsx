import { useEffect, useRef, useState, type FormEvent } from "react";
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

type BusyAction = "email" | "google" | "reset" | null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readableError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";
  }

  const messages: Record<string, string> = {
    "auth/invalid-email": "Enter a valid work email address.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed":
      "Check your internet connection and try again.",
    "auth/popup-blocked":
      "Allow popups in your browser and try again.",
    "auth/popup-closed-by-user":
      "Google sign-in was cancelled.",
    "auth/unauthorized-domain":
      "Add this website domain to Firebase authorized domains.",
    "auth/operation-not-allowed":
      "Enable this login method in Firebase Authentication.",
    "auth/account-exists-with-different-credential":
      "Use the sign-in method already linked to this email.",
  };

  return messages[error.code] ?? "Unable to complete the request. Try again.";
}

function GoogleMark() {
  return (
    <svg
      className="google-mark"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.28-3.13.78-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}

export default function Login() {
  const {
    user: workspaceUser,
    error: workspaceError,
    loading: checking,
    login,
    loginGoogle,
  } = useWorkspace();

  const emailInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const disabled = checking || busy !== null;
  const visibleError = error || workspaceError;

  useEffect(() => {
    if (!checking) {
      emailInputRef.current?.focus();
    }
  }, [checking]);

  if (!checking && workspaceUser) {
    return (
      <Navigate
        to={dashboardPath[workspaceUser.role] ?? "/"}
        replace
      />
    );
  }

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled) return;

    clearMessages();

    const normalizedEmail = email.trim();

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid work email address.");
      return;
    }

    if (!password) {
      setError("Enter your password to continue.");
      return;
    }

    setBusy("email");

    try {
      await login(normalizedEmail, password);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    if (disabled) return;

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
    if (disabled) return;

    clearMessages();

    const normalizedEmail = email.trim();

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter your work email first to reset your password.");
      return;
    }

    setBusy("reset");

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setSuccess(
        "If an account exists, a password reset link will arrive in your inbox.",
      );
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="auth-screen" aria-busy={checking}>
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />

      <div className="auth-shell">
        <section className="auth-story">
          <div
            className="auth-brand"
            aria-label="creative-crew CREATIVE WORKSPACE"
          >
            <span className="auth-brand-icon" aria-hidden="true">
              <Layers size={23} strokeWidth={2.1} />
            </span>

            <div>
              <strong>creative-crew</strong>
              <small>CREATIVE WORKSPACE</small>
            </div>
          </div>

          <div className="auth-story-copy">
            <span className="auth-pill">
              <Sparkles size={13} aria-hidden="true" />
              PLAN · CREATE · GROW
            </span>

            <h1>
              Where great work finds its <em>flow.</em>
            </h1>

            <p>
              Bring people, projects and progress together in one calm,
              focused workspace built for creative teams.
            </p>

            <div className="auth-benefits">
              <span>
                <Check size={15} aria-hidden="true" />
                Clear priorities
              </span>

              <span>
                <Check size={15} aria-hidden="true" />
                Better teamwork
              </span>

              <span>
                <Check size={15} aria-hidden="true" />
                Meaningful progress
              </span>
            </div>
          </div>

          <div className="auth-story-bottom">
            <span className="auth-mini-stat">
              <Users size={16} aria-hidden="true" />
              <strong>One connected team</strong>
            </span>

            <span className="auth-mini-stat">
              <BarChart3 size={16} aria-hidden="true" />
              <strong>Work with direction</strong>
            </span>
          </div>
        </section>

        <section className="auth-panel" aria-labelledby="login-title">
          <div className="auth-secure">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Secure Firebase workspace access</span>
          </div>

          <div className="auth-form-wrap">
            <div className="auth-welcome-icon" aria-hidden="true">
              <Layers size={27} strokeWidth={2.1} />
            </div>

            <span className="auth-eyebrow">WELCOME BACK</span>

            <h2 id="login-title">
              Let&apos;s get creating<span>.</span>
            </h2>

            <p className="auth-description">
              Sign in to continue to your role-based workspace.
            </p>

            {checking && (
              <div className="auth-status" role="status" aria-live="polite">
                <LoaderCircle size={17} className="spin" aria-hidden="true" />
                Preparing your workspace…
              </div>
            )}

            {visibleError && (
              <div
                className="auth-message auth-error"
                role="alert"
                aria-live="assertive"
              >
                {visibleError}
              </div>
            )}

            {success && (
              <div
                className="auth-message auth-success"
                role="status"
                aria-live="polite"
              >
                {success}
              </div>
            )}

            <button
              className="google-button"
              type="button"
              onClick={() => void handleGoogle()}
              disabled={disabled}
            >
              <span aria-hidden="true">
                {busy === "google" ? (
                  <LoaderCircle size={19} className="spin" />
                ) : (
                  <GoogleMark />
                )}
              </span>

              {busy === "google"
                ? "Connecting to Google…"
                : "Continue with Google"}
            </button>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="login-email">Work email</label>

              <div className="auth-input">
                <Mail size={18} aria-hidden="true" />

                <input
                  ref={emailInputRef}
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearMessages();
                  }}
                  disabled={disabled}
                  required
                />
              </div>

              <div className="auth-password-label">
                <label htmlFor="login-password">Password</label>

                <button
                  type="button"
                  onClick={() => void handleReset()}
                  disabled={disabled}
                >
                  {busy === "reset" ? "Sending…" : "Forgot password?"}
                </button>
              </div>

              <div className="auth-input">
                <LockKeyhole size={18} aria-hidden="true" />

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearMessages();
                  }}
                  disabled={disabled}
                  required
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={disabled}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={disabled}
              >
                <span>
                  {(busy === "email" || checking) && (
                    <LoaderCircle
                      size={17}
                      className="spin"
                      aria-hidden="true"
                    />
                  )}

                  {checking
                    ? "Preparing workspace…"
                    : busy === "email"
                      ? "Signing in…"
                      : "Enter your workspace"}
                </span>

                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>

            <p className="auth-trust">
              <ShieldCheck size={14} aria-hidden="true" />
              Your identity is protected by Firebase Authentication.
            </p>

            <p className="auth-help">
              Need an account? Contact your workspace administrator.
            </p>
          </div>

          <footer className="auth-footer">
            © {new Date().getFullYear()} creative-crew{" "}
            <span>Built for focused teams.</span>
          </footer>
        </section>
      </div>
    </main>
  );
}