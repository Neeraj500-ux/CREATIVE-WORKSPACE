import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  BellRing,
  BriefcaseBusiness,
  Check,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Avatar } from "../components/ui";
import { roleDescriptions, roleLabels } from "../types";
import { useWorkspace, type ProfilePatch } from "../services/workspace";

type PreferenceKey =
  | "email"
  | "task_updates"
  | "approvals"
  | "announcements";

type Preferences = Record<PreferenceKey, boolean>;

type TextField =
  | "name"
  | "phone"
  | "job_title"
  | "location"
  | "bio";

const defaultPreferences: Preferences = {
  email: true,
  task_updates: true,
  approvals: true,
  announcements: true,
};

const preferenceOptions: Array<
  readonly [PreferenceKey, string, string]
> = [
  [
    "task_updates",
    "Task updates",
    "When work assigned to you changes",
  ],
  [
    "approvals",
    "Approvals",
    "Reviews and feedback that need attention",
  ],
  [
    "announcements",
    "Announcements",
    "Important workspace news",
  ],
  [
    "email",
    "Email summaries",
    "A helpful digest in your inbox",
  ],
];

const cardClass =
  "min-w-0 rounded-[22px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_60px_-30px_rgba(15,55,110,0.35)] backdrop-blur-xl sm:rounded-[26px] sm:p-6";

// NOTE: horizontal padding is intentionally split (no shared `px-4`) so that
// the icon-field variant can safely add left clearance with `pl-11` without
// a Tailwind cascade-order clash against a competing `px-4` utility.
const inputBaseClass =
  "block h-12 !w-full min-w-0 rounded-2xl border border-slate-200 bg-white py-2.5 pr-4 text-left text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60";

const inputPlainClass = `${inputBaseClass} pl-4`;
const inputIconClass = `${inputBaseClass} pl-11`;

const textareaClass =
  "block min-h-[110px] !w-full min-w-0 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "flex min-w-0 flex-col gap-2 text-left text-[13px] font-bold text-slate-700";

export default function Profile() {
  const { user, updateProfile } = useWorkspace();

  const [form, setForm] = useState<ProfilePatch>(() => ({
    name: user?.name || "",
    phone: user?.phone || "",
    job_title: user?.job_title || "",
    location: user?.location || "",
    bio: user?.bio || "",
  }));

  const [preferences, setPreferences] = useState<Preferences>(() => ({
    ...defaultPreferences,
    ...(user?.notification_preferences || {}),
  }));

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      phone: user.phone || "",
      job_title: user.job_title || "",
      location: user.location || "",
      bio: user.bio || "",
    });

    setPreferences({
      ...defaultPreferences,
      ...(user.notification_preferences || {}),
    });
  }, [user?.email]);

  if (!user) return null;

  const roleName = roleLabels[user.role] || "Workspace member";
  const roleDescription =
    roleDescriptions[user.role] ||
    "A valued member of your creative workspace.";

  const update =
    (field: TextField) =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));

      setMessage("");
      setError("");
    };

  const updatePreference =
    (key: PreferenceKey) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setPreferences((current) => ({
        ...current,
        [key]: event.target.checked,
      }));

      setMessage("");
      setError("");
    };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    const name = String(form.name || "").trim();

    if (name.length < 2) {
      setError("Please enter your full name.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const cleanForm = {
      ...form,
      name,
      phone: String(form.phone || "").trim(),
      job_title: String(form.job_title || "").trim(),
      location: String(form.location || "").trim(),
      bio: String(form.bio || "").trim(),
      notification_preferences: preferences,
    };

    try {
      await updateProfile(cleanForm);

      setForm((current) => ({
        ...current,
        name: cleanForm.name,
        phone: cleanForm.phone,
        job_title: cleanForm.job_title,
        location: cleanForm.location,
        bio: cleanForm.bio,
      }));

      setMessage("Your profile is up to date.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="relative isolate min-h-full min-w-0 overflow-x-hidden bg-[#f4f8ff] px-3 pb-28 pt-[max(7.5rem,env(safe-area-inset-top)+5.5rem)] sm:px-5 sm:pt-32 md:pb-10 md:pt-8 lg:px-8"
      aria-busy={saving}
    >
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-80 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <header className="mb-5 flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-cyan-700 sm:text-[11px]">
              <UserRound size={14} className="shrink-0" />
              <span className="truncate">YOUR WORKSPACE IDENTITY</span>
            </span>

            <h1 className="mt-2 break-words text-[clamp(1.65rem,7vw,3rem)] font-black leading-[1.08] tracking-[-0.04em] text-[#071a3d]">
              Profile & preferences
            </h1>

            <p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-500 sm:text-sm">
              Keep your details current so the right work reaches the right
              person.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
            Active account
          </div>
        </header>

        <section className="relative mb-5 min-w-0 overflow-hidden rounded-[22px] border border-white/20 bg-gradient-to-br from-[#07183f] via-[#0b2e5e] to-[#07566a] px-4 py-5 text-white shadow-[0_24px_70px_-30px_rgba(5,38,91,0.65)] sm:rounded-[26px] sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border border-cyan-200/20 bg-cyan-300/10 blur-sm" />

          <div className="relative z-10 flex min-w-0 items-center gap-3 sm:gap-5">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-cyan-300 via-emerald-300 to-blue-500 p-1 shadow-[0_12px_30px_rgba(34,211,238,0.3)] sm:h-[70px] sm:w-[70px] sm:rounded-[21px]">
              <div className="grid h-full w-full place-items-center overflow-hidden rounded-[14px] bg-[#0b2855] sm:rounded-[17px]">
                <Avatar name={user.name} role={user.role} />
              </div>

              <span
                className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-[3px] border-[#0b315c] bg-emerald-400 text-[#06233f]"
                aria-label="Verified active account"
              >
                <Check size={11} strokeWidth={3} />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <span className="block truncate text-[9px] font-black tracking-[0.18em] text-cyan-200 sm:text-[10px] sm:tracking-[0.2em]">
                {roleName.toUpperCase()} ACCESS
              </span>

              <h2 className="mt-1 truncate text-lg font-bold tracking-[-0.03em] sm:text-3xl sm:tracking-[-0.04em]">
                {user.name}
              </h2>

              <p className="mt-1 max-w-xl truncate text-[11px] text-blue-100/80 sm:text-xs">
                {roleDescription}
              </p>

              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 sm:mt-3">
                <span className="rounded-full border border-cyan-200/30 bg-white/10 px-3 py-1 text-[10px] font-bold text-cyan-50 backdrop-blur sm:text-[11px]">
                  {roleName}
                </span>

                <span className="max-w-[160px] truncate text-[10px] text-blue-100/80 sm:max-w-[300px] sm:text-[11px]">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 text-cyan-200/30 md:block">
              <ShieldCheck size={64} strokeWidth={1} />
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <form
            className={cardClass}
            onSubmit={submit}
            noValidate
          >
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="min-w-0">
                <span className="text-[10px] font-black tracking-[0.2em] text-cyan-700 sm:text-[11px]">
                  PERSONAL DETAILS
                </span>

                <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#071a3d] sm:text-2xl sm:tracking-[-0.04em]">
                  About you
                </h3>
              </div>

              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                <BriefcaseBusiness size={18} />
              </span>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass} htmlFor="profile-name">
                <span>Full name</span>

                <div className="relative min-w-0">
                  <UserRound
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="profile-name"
                    name="name"
                    value={form.name || ""}
                    onChange={update("name")}
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    required
                    disabled={saving}
                    className={inputIconClass}
                  />
                </div>
              </label>

              <label className={labelClass} htmlFor="profile-email">
                <span>Work email</span>

                <div className="relative min-w-0">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="profile-email"
                    name="email"
                    value={user.email}
                    readOnly
                    autoComplete="email"
                    className={`${inputIconClass} bg-slate-100/90 text-slate-500`}
                  />
                </div>
              </label>

              <label className={labelClass} htmlFor="profile-phone">
                <span>Phone number</span>

                <div className="relative min-w-0">
                  <Phone
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="profile-phone"
                    name="phone"
                    value={form.phone || ""}
                    onChange={update("phone")}
                    placeholder="+91 98765 43210"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    disabled={saving}
                    className={inputIconClass}
                  />
                </div>
              </label>

              <label className={labelClass} htmlFor="profile-job-title">
                <span>Job title</span>

                <div className="relative min-w-0">
                  <BriefcaseBusiness
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="profile-job-title"
                    name="job_title"
                    value={form.job_title || ""}
                    onChange={update("job_title")}
                    placeholder="Your role in the studio"
                    autoComplete="organization-title"
                    maxLength={80}
                    disabled={saving}
                    className={inputIconClass}
                  />
                </div>
              </label>

              <label className={labelClass} htmlFor="profile-department">
                <span>Department</span>

                <input
                  id="profile-department"
                  value={user.department || user.team_id || "Not assigned"}
                  readOnly
                  className={`${inputPlainClass} bg-slate-100/90 text-slate-500`}
                />
              </label>

              <label className={labelClass} htmlFor="profile-location">
                <span>Location</span>

                <div className="relative min-w-0">
                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="profile-location"
                    name="location"
                    value={form.location || ""}
                    onChange={update("location")}
                    placeholder="New Delhi, India"
                    autoComplete="address-level2"
                    maxLength={100}
                    disabled={saving}
                    className={inputIconClass}
                  />
                </div>
              </label>
            </div>

            <label
              className={`${labelClass} mt-5`}
              htmlFor="profile-bio"
            >
              <span>Short bio</span>

              <textarea
                id="profile-bio"
                name="bio"
                value={form.bio || ""}
                onChange={update("bio")}
                rows={4}
                maxLength={240}
                placeholder="A short note about what you do best…"
                disabled={saving}
                className={textareaClass}
              />

              <span className="text-right text-[11px] font-normal text-slate-400">
                {(form.bio || "").length}/240
              </span>
            </label>

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs leading-5 text-slate-500">
                Role and permissions are managed by your workspace
                administrator.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0756a5] to-[#0796b4] px-5 text-sm font-bold text-white shadow-[0_12px_24px_-10px_rgba(7,116,180,0.8)] transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>

            {error && (
              <p
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                role="status"
              >
                {message}
              </p>
            )}
          </form>

          <aside className="min-w-0 space-y-5">
            <section className={cardClass}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black tracking-[0.2em] text-cyan-700 sm:text-[11px]">
                    ACCOUNT DETAILS
                  </span>

                  <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#071a3d] sm:text-2xl sm:tracking-[-0.04em]">
                    Your access
                  </h3>
                </div>

                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                  <ShieldCheck size={18} />
                </span>
              </div>

              <dl className="divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <dt className="text-sm text-slate-500">Role</dt>
                  <dd className="text-right text-sm font-bold text-slate-800">
                    {roleName}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-500">
                    Reporting line
                  </dt>
                  <dd className="max-w-[62%] break-words text-right text-sm font-bold text-slate-800">
                    {user.reports_to || "Workspace leadership"}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-500">Joined</dt>
                  <dd className="text-right text-sm font-bold text-slate-800">
                    {user.joined_at || "Not recorded"}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
                  <dt className="text-sm text-slate-500">Account</dt>
                  <dd className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Active
                  </dd>
                </div>
              </dl>
            </section>

            <section className={cardClass}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black tracking-[0.2em] text-cyan-700 sm:text-[11px]">
                    NOTIFICATIONS
                  </span>

                  <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#071a3d] sm:text-2xl sm:tracking-[-0.04em]">
                    Stay in the loop
                  </h3>
                </div>

                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                  <BellRing size={18} />
                </span>
              </div>

              <p className="mb-4 text-sm leading-6 text-slate-500">
                Choose the updates that help you keep momentum.
              </p>

              <div className="divide-y divide-slate-100">
                {preferenceOptions.map(([key, label, note]) => (
                  <label
                    key={key}
                    className={`flex min-w-0 items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 ${
                      saving
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }`}
                  >
                    <span className="min-w-0">
                      <strong className="block text-sm text-slate-800">
                        {label}
                      </strong>

                      <small className="mt-1 block text-xs leading-5 text-slate-500">
                        {note}
                      </small>
                    </span>

                    <span className="relative inline-flex h-6 w-11 shrink-0">
                      <input
                        type="checkbox"
                        name={`notification-${key}`}
                        checked={preferences[key]}
                        onChange={updatePreference(key)}
                        disabled={saving}
                        className="peer sr-only"
                      />

                      <span className="absolute inset-0 rounded-full bg-slate-200 transition peer-checked:bg-cyan-500 peer-focus-visible:ring-4 peer-focus-visible:ring-cyan-500/20" />

                      <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className={`${cardClass} flex items-center gap-4`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                <MapPin size={19} />
              </span>

              <div className="min-w-0">
                <strong className="block text-sm text-slate-800">
                  Workspace location
                </strong>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {form.location || "Set your location above"}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}