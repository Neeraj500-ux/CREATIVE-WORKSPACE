import { useState, type ChangeEvent, type FormEvent } from "react";
import { BellRing, BriefcaseBusiness, Check, MapPin, Save, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, Badge, Button } from "../components/ui";
import { roleDescriptions, roleLabels } from "../types";
import { useWorkspace, type ProfilePatch } from "../services/workspace";

const defaultPreferences = {
  email: true,
  task_updates: true,
  approvals: true,
  announcements: true,
};

export default function Profile() {
  const { user, updateProfile } = useWorkspace();
  const [form, setForm] = useState<ProfilePatch>(() => ({
    name: user?.name || "",
    phone: user?.phone || "",
    job_title: user?.job_title || "",
    location: user?.location || "",
    bio: user?.bio || "",
  }));
  const [preferences, setPreferences] = useState(() => ({
    ...defaultPreferences,
    ...user?.notification_preferences,
  }));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const update = (field: keyof ProfilePatch) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setMessage("");
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateProfile({ ...form, notification_preferences: preferences });
      setMessage("Your profile is up to date.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="page-heading profile-heading">
        <div>
          <span className="eyebrow"><UserRound size={14} /> YOUR WORKSPACE IDENTITY</span>
          <h1>Profile & preferences</h1>
          <p className="muted">Keep your details current so the right work reaches the right person.</p>
        </div>
        <div className="profile-status"><span className="dot" /> Active account</div>
      </header>

      <section className={`profile-hero profile-hero-${user.role}`}>
        <div className="profile-avatar-wrap"><Avatar name={user.name} role={user.role} /><span><Check size={12} /></span></div>
        <div className="profile-hero-copy">
          <span className="eyebrow">{roleLabels[user.role].toUpperCase()} ACCESS</span>
          <h2>{user.name}</h2>
          <p>{roleDescriptions[user.role]}</p>
          <div className="profile-hero-meta"><Badge value={roleLabels[user.role]} /><span>{user.email}</span></div>
        </div>
        <div className="profile-hero-shield"><ShieldCheck size={72} strokeWidth={1} /></div>
      </section>

      <div className="profile-grid">
        <form className="card profile-form" onSubmit={submit}>
          <div className="card-heading"><div><span className="eyebrow">PERSONAL DETAILS</span><h3>About you</h3></div><span className="heading-icon"><BriefcaseBusiness size={18} /></span></div>
          <div className="form-grid">
            <label>Full name<input value={form.name || ""} onChange={update("name")} required minLength={2} /></label>
            <label>Work email<input value={user.email} readOnly className="readonly" /></label>
            <label>Phone number<input value={form.phone || ""} onChange={update("phone")} placeholder="+91 98765 43210" inputMode="tel" /></label>
            <label>Job title<input value={form.job_title || ""} onChange={update("job_title")} placeholder="Your role in the studio" /></label>
            <label>Department<input value={user.department || user.team_id || "Not assigned"} readOnly className="readonly" /></label>
            <label>Location<input value={form.location || ""} onChange={update("location")} placeholder="New Delhi, India" /></label>
          </div>
          <label>Short bio<textarea value={form.bio || ""} onChange={update("bio")} rows={4} maxLength={240} placeholder="A short note about what you do best…" /></label>
          <div className="profile-form-foot"><span className="muted">Role and permissions are managed by your workspace administrator.</span><Button disabled={saving}><Save size={16} />{saving ? "Saving…" : "Save changes"}</Button></div>
          {error && <p className="error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}
        </form>

        <aside className="profile-side">
          <section className="card profile-facts">
            <div className="card-heading"><div><span className="eyebrow">ACCOUNT DETAILS</span><h3>Your access</h3></div><span className="heading-icon"><ShieldCheck size={18} /></span></div>
            <dl>
              <div><dt>Role</dt><dd>{roleLabels[user.role]}</dd></div>
              <div><dt>Reporting line</dt><dd>{user.reports_to || "Workspace leadership"}</dd></div>
              <div><dt>Joined</dt><dd>{user.joined_at || "Not recorded"}</dd></div>
              <div><dt>Account</dt><dd className="success-text">Active</dd></div>
            </dl>
          </section>

          <section className="card preference-card">
            <div className="card-heading"><div><span className="eyebrow">NOTIFICATIONS</span><h3>Stay in the loop</h3></div><span className="heading-icon"><BellRing size={18} /></span></div>
            <p className="muted">Choose the updates that help you keep momentum.</p>
            {([
              ["task_updates", "Task updates", "When work assigned to you changes"],
              ["approvals", "Approvals", "Reviews and feedback that need attention"],
              ["announcements", "Announcements", "Important workspace news"],
              ["email", "Email summaries", "A helpful digest in your inbox"],
            ] as const).map(([key, label, note]) => (
              <label className="preference-row" key={key}><span><strong>{label}</strong><small>{note}</small></span><input type="checkbox" checked={preferences[key]} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} /></label>
            ))}
          </section>

          <section className="card profile-location"><span className="location-icon"><MapPin size={18} /></span><div><strong>Workspace location</strong><p>{user.location || "Set your location above"}</p></div></section>
        </aside>
      </div>
    </div>
  );
}
