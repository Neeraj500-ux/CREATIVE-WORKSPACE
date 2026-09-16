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
      className="h-5 w-5 shrink-0"
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
    <main
      className="relative min-h-screen overflow-hidden bg-[#020617] text-white selection:bg-cyan-300/30"
      aria-busy={checking}
    >
      <div
        className="pointer-events-none absolute -left-40 top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/25 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute bottom-[-180px] right-[-100px] h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:42px_42px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1500px] grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <section className="hidden min-h-screen flex-col justify-between px-8 py-8 lg:flex xl:px-16">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/30 bg-gradient-to-br from-cyan-300 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Layers size={24} strokeWidth={2.2} />
            </span>

            <div className="min-w-0">
              <strong className="block text-lg font-black tracking-tight text-white">
                creative-crew
              </strong>
              <small className="block text-[10px] font-bold tracking-[0.22em] text-cyan-100/65">
                CREATIVE WORKSPACE
              </small>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.16em] text-cyan-100 backdrop-blur-xl">
              <Sparkles size={14} />
              <span>PLAN · CREATE · GROW</span>
            </div>

            <h1 className="text-5xl font-black leading-[1.02] tracking-[-0.055em] text-white xl:text-7xl">
              Where great work finds its{" "}
              <em className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text not-italic text-transparent">
                flow.
              </em>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              Bring people, projects and progress together in one calm,
              focused workspace built for creative teams.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Clear priorities",
                "Better teamwork",
                "Meaningful progress",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-slate-200"
                >
                  <Check size={15} className="text-cyan-300" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-8 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Users size={17} className="text-cyan-300" />
              <strong>One connected team</strong>
            </span>

            <span className="inline-flex items-center gap-2">
              <BarChart3 size={17} className="text-cyan-300" />
              <strong>Work with direction</strong>
            </span>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center border-white/10 bg-slate-950/60 px-4 py-7 backdrop-blur-2xl sm:px-7 sm:py-10 lg:border-l lg:px-12">
          <div className="w-full max-w-[520px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Layers size={22} />
              </span>

              <div>
                <strong className="block text-base font-black text-white">
                  creative-crew
                </strong>
                <small className="block text-[9px] font-bold tracking-[0.18em] text-cyan-100/65">
                  CREATIVE WORKSPACE
                </small>
              </div>
            </div>

            <div className="mb-7 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/[0.08] px-3.5 py-2 text-center text-[11px] font-semibold leading-4 text-cyan-100">
              <ShieldCheck size={16} className="shrink-0 text-cyan-300" />
              <span>Secure Firebase workspace access</span>
            </div>

            <div className="mb-7">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/25 to-blue-600/30 text-cyan-200 shadow-xl shadow-cyan-950/30">
                <Layers size={28} strokeWidth={2} />
              </div>

              <span className="text-xs font-black tracking-[0.24em] text-cyan-300">
                WELCOME BACK
              </span>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
                Let&apos;s get creating
                <span className="text-cyan-300">.</span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                Sign in to continue to your role-based workspace.
              </p>
            </div>

            {checking && (
              <div
                className="mb-5 flex items-center gap-2 rounded-2xl border border-blue-300/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-100"
                role="status"
                aria-live="polite"
              >
                <LoaderCircle size={17} className="shrink-0 animate-spin" />
                <span>Preparing your workspace…</span>
              </div>
            )}

            {visibleError && (
              <div
                className="mb-5 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-100"
                role="alert"
                aria-live="assertive"
              >
                {visibleError}
              </div>
            )}

            {success && (
              <div
                className="mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100"
                role="status"
                aria-live="polite"
              >
                {success}
              </div>
            )}

            <button
              className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:border-cyan-300/40 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-55"
              type="button"
              onClick={() => void handleGoogle()}
              disabled={disabled}
            >
              <span className="flex shrink-0 items-center justify-center">
                {busy === "google" ? (
                  <LoaderCircle size={20} className="animate-spin text-cyan-300" />
                ) : (
                  <GoogleMark />
                )}
              </span>

              <span>
                {busy === "google"
                  ? "Connecting to Google…"
                  : "Continue with Google"}
              </span>
            </button>

            <div className="my-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 sm:gap-4 sm:text-xs">
              <span className="h-px flex-1 bg-white/10" />
              <span className="whitespace-nowrap">or continue with email</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form
              className="space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="flex items-center gap-2 text-sm font-bold text-slate-200"
                >
                  <Mail size={16} className="shrink-0 text-cyan-300" />
                  <span>Work email</span>
                </label>

                <div className="relative w-full">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />

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
                    className="h-14 w-full min-w-0 rounded-2xl border border-white/12 bg-white/[0.07] pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:bg-white/[0.11] focus:ring-4 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="login-password"
                    className="flex items-center gap-2 text-sm font-bold text-slate-200"
                  >
                    <LockKeyhole size={16} className="shrink-0 text-cyan-300" />
                    <span>Password</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleReset()}
                    disabled={disabled}
                    className="shrink-0 text-xs font-bold text-cyan-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === "reset" ? "Sending…" : "Forgot password?"}
                  </button>
                </div>

                <div className="relative w-full">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />

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
                    className="h-14 w-full min-w-0 rounded-2xl border border-white/12 bg-white/[0.07] pl-12 pr-14 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:bg-white/[0.11] focus:ring-4 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={disabled}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                className="group flex min-h-14 w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 px-5 text-sm font-black text-white shadow-xl shadow-cyan-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={disabled}
              >
                <span className="flex flex-1 items-center justify-center gap-2">
                  {(busy === "email" || checking) && (
                    <LoaderCircle size={18} className="animate-spin" />
                  )}

                  <span>
                    {checking
                      ? "Preparing workspace…"
                      : busy === "email"
                        ? "Signing in…"
                        : "Enter your workspace"}
                  </span>
                </span>

                <ArrowRight
                  size={19}
                  className="shrink-0 transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            <div className="mt-7 space-y-3 text-center">
              <p className="flex items-center justify-center gap-2 text-xs leading-5 text-slate-400">
                <ShieldCheck size={15} className="shrink-0 text-cyan-300" />
                <span>
                  Your identity is protected by Firebase Authentication.
                </span>
              </p>

              <p className="text-xs leading-5 text-slate-500">
                Need an account? Contact your workspace administrator.
              </p>
            </div>

            <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} creative-crew
              <span className="mx-2 text-slate-700">·</span>
              <span>Built for focused teams.</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}