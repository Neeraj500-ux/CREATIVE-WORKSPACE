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
  "rounded-[26px] border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_60px_-30px_rgba(15,55,110,0.35)] backdrop-blur-xl sm:p-6";

const inputClass =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "flex flex-col gap-2 text-[13px] font-semibold text-slate-700";

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
    setMessage("");
    setError("");

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
      className="relative min-h-full overflow-x-hidden bg-[#f4f8ff] px-4 py-5 sm:px-6 lg:px-8"
      aria-busy={saving}
    >
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-72 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-cyan-700">
              <UserRound size={14} />
              YOUR WORKSPACE IDENTITY
            </span>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#071a3d] sm:text-4xl lg:text-[44px]">
              Profile & preferences
            </h1>

            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Keep your details current so the right work reaches the right
              person.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
            Active account
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-[#07183f] via-[#0b2e5e] to-[#07566a] px-5 py-5 text-white shadow-[0_24px_70px_-30px_rgba(5,38,91,0.65)] sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border border-cyan-200/20 bg-cyan-300/10 blur-sm" />
          <div className="pointer-events-none absolute bottom-[-90px] right-28 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative z-10 flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="relative grid h-[70px] w-[70px] shrink-0 place-items-center rounded-[23px] bg-gradient-to-br from-cyan-300 via-emerald-300 to-blue-500 p-1 shadow-[0_12px_30px_rgba(34,211,238,0.3)]">
              <div className="grid h-full w-full place-items-center overflow-hidden rounded-[19px] bg-[#0b2855]">
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
              <span className="text-[10px] font-black tracking-[0.2em] text-cyan-200">
                {roleName.toUpperCase()} ACCESS
              </span>

              <h2 className="mt-1 truncate text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
                {user.name}
              </h2>

              <p className="mt-1 max-w-xl truncate text-xs text-blue-100/80">
                {roleDescription}
              </p>

              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200/30 bg-white/10 px-3 py-1 text-[11px] font-bold text-cyan-50 backdrop-blur">
                  {roleName}
                </span>

                <span className="max-w-full truncate text-[11px] text-blue-100/80">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 text-cyan-200/30 sm:block">
              <ShieldCheck size={64} strokeWidth={1} />
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <form
            className={cardClass}
            onSubmit={submit}
            noValidate
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-black tracking-[0.2em] text-cyan-700">
                  PERSONAL DETAILS
                </span>

                <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071a3d]">
                  About you
                </h3>
              </div>

              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                <BriefcaseBusiness size={18} />
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass} htmlFor="profile-name">
                <span>Full name</span>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </label>

              <label className={labelClass} htmlFor="profile-email">
                <span>Work email</span>

                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="profile-email"
                    name="email"
                    value={user.email}
                    readOnly
                    autoComplete="email"
                    className={`${inputClass} bg-slate-100/80 pl-11 text-slate-500`}
                  />
                </div>
              </label>

              <label className={labelClass} htmlFor="profile-phone">
                <span>Phone number</span>

                <div className="relative">
                  <Phone
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </label>

              <label className={labelClass} htmlFor="profile-job-title">
                <span>Job title</span>

                <div className="relative">
                  <BriefcaseBusiness
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </label>

              <label className={labelClass} htmlFor="profile-department">
                <span>Department</span>

                <input
                  id="profile-department"
                  value={user.department || user.team_id || "Not assigned"}
                  readOnly
                  className={`${inputClass} bg-slate-100/80 text-slate-500`}
                />
              </label>

              <label className={labelClass} htmlFor="profile-location">
                <span>Location</span>

                <div className="relative">
                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className={`${inputClass} pl-11`}
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0756a5] to-[#0796b4] px-5 text-sm font-bold text-white shadow-[0_12px_24px_-10px_rgba(7,116,180,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-10px_rgba(7,116,180,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
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

          <aside className="space-y-5">
            <section className={cardClass}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black tracking-[0.2em] text-cyan-700">
                    ACCOUNT DETAILS
                  </span>

                  <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071a3d]">
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

                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-500">
                    Reporting line
                  </dt>
                  <dd className="max-w-[170px] truncate text-right text-sm font-bold text-slate-800">
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
                  <span className="text-[11px] font-black tracking-[0.2em] text-cyan-700">
                    NOTIFICATIONS
                  </span>

                  <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071a3d]">
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
                    className={`flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 ${
                      saving ? "cursor-not-allowed opacity-60" : "cursor-pointer"
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