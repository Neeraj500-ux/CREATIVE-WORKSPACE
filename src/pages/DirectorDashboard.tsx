import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  FolderKanban,
  Gauge,
  KanbanSquare,
  LayoutDashboard,
  List as ListIcon,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Target,
  Timer,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Avatar, Badge, Button, Empty, Modal } from "../components/ui";
import { scoped, useWorkspace } from "../services/workspace";
import { departments, statuses, type Entity } from "../types";
import { exportCSV } from "../lib/csv";
import { TaskPanel } from "../components/TaskPanel";

type DirectorView = "overview" | "list" | "board" | "calendar" | "timeline" | "workload";
type ComposerKind = "task" | "project";

type ComposerForm = {
  name: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  projectId: string;
  clientId: string;
  due: string;
  startDate: string;
  hours: string;
  amount: string;
  department: string;
  spaceId: string;
  tags: string;
};

type Metric = {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  tone: string;
};

const DEFAULT_SPACES: Entity[] = departments.map((name, index) => ({
  id: `space-${name.toLowerCase().replaceAll(" ", "-")}`,
  name,
  status: "Active",
  color: ["#8b5cf6", "#2563eb", "#0f9f93", "#f59e0b", "#ec4899"][index],
  description: `${name} delivery space`,
}));

const viewOptions: Array<{ id: DirectorView; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "list", label: "List", icon: ListIcon },
  { id: "board", label: "Board", icon: KanbanSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "timeline", label: "Timeline", icon: BarChart3 },
  { id: "workload", label: "Workload", icon: Users },
];

const projectStatuses = ["Planning", "Active", "At Risk", "On Hold", "Completed"];

function slug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creative";
}

function dateKey(value?: unknown): string {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function dateLabel(value?: unknown): string {
  const key = dateKey(value);
  if (!key) return "No date";
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? key
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fullDateLabel(value?: unknown): string {
  const key = dateKey(value);
  if (!key) return "No deadline";
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? key
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function currency(value: unknown): string {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function tagsFor(row: Partial<Entity>): string[] {
  if (Array.isArray(row.tags)) return row.tags.map(String).filter(Boolean);
  if (typeof row.tags === "string") return row.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function isOverdue(row: Entity, today = new Date().toISOString().slice(0, 10)): boolean {
  return row.status !== "Completed" && Boolean(dateKey(row.due)) && dateKey(row.due) < today;
}

function priorityWeight(value?: unknown): number {
  return ({ Urgent: 4, High: 3, Medium: 2, Low: 1 } as Record<string, number>)[String(value)] || 0;
}

function progressFor(projectId: string, tasks: Entity[]): number {
  const related = tasks.filter((task) => task.project_id === projectId);
  if (!related.length) return 0;
  return Math.round((related.filter((task) => task.status === "Completed").length / related.length) * 100);
}

function resolveSpaceId(row: Entity, projects: Map<string, Entity>): string {
  const projectSpace = row.project_id ? projects.get(String(row.project_id))?.space_id : undefined;
  return String(row.space_id || projectSpace || `space-${slug(String(row.department || row.team_id || "Creative"))}`);
}

function initialsColor(space: Entity): string {
  return typeof space.color === "string" && space.color ? space.color : "#2563eb";
}

function DirectorComposer({
  kind,
  row,
  spaces,
  defaultSpaceId,
  onClose,
}: {
  kind: ComposerKind;
  row?: Entity;
  spaces: Entity[];
  defaultSpaceId: string;
  onClose: () => void;
}) {
  const { data, user, save } = useWorkspace();
  const people = data.employees || [];
  const projects = data.projects || [];
  const clients = data.clients || [];
  const existingSpace = String(row?.space_id || defaultSpaceId || spaces[0]?.id || "");
  const existingSpaceName = spaces.find((space) => space.id === existingSpace)?.name || departments[0];
  const [form, setForm] = useState<ComposerForm>(() => ({
    name: row?.name || "",
    description: row?.description || "",
    status: row?.status || (kind === "task" ? "To Do" : "Planning"),
    priority: row?.priority || "Medium",
    assignee: row?.assignee ? String(row.assignee) : user?.id || "",
    projectId: row?.project_id ? String(row.project_id) : "",
    clientId: row?.client_id ? String(row.client_id) : "",
    due: dateKey(row?.due),
    startDate: dateKey(row?.start_date),
    hours: String(row?.hours || ""),
    amount: String(row?.amount || ""),
    department: row?.department || existingSpaceName,
    spaceId: existingSpace,
    tags: tagsFor(row || {}).join(", "),
  }));
  const [error, setError] = useState("");

  const update = (field: keyof ComposerForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Enter a name with at least two characters.");
      return;
    }
    try {
      const space = spaces.find((item) => item.id === form.spaceId);
      const folder = (data.folders || []).find((item) => item.space_id === form.spaceId);
      const list = (data.lists || []).find((item) => item.space_id === form.spaceId);
      if (kind === "task") {
        await save("tasks", {
          id: row?.id,
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
          priority: form.priority,
          assignee: form.assignee || undefined,
          project_id: form.projectId || undefined,
          client_id: form.clientId || undefined,
          due: form.due || undefined,
          start_date: form.startDate || undefined,
          hours: Number(form.hours || 0),
          department: form.department,
          team_id: form.department,
          space_id: form.spaceId || space?.id,
          folder_id: folder?.id,
          list_id: list?.id,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        });
      } else {
        await save("projects", {
          id: row?.id,
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
          assignee: form.assignee || undefined,
          client_id: form.clientId || undefined,
          due: form.due || undefined,
          department: form.department,
          team_id: form.department,
          space_id: form.spaceId || space?.id,
          folder_id: folder?.id,
          list_id: list?.id,
          hours: Number(form.hours || 0),
          amount: Number(form.amount || 0),
        });
      }
      onClose();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const statusOptions = kind === "task" ? statuses : projectStatuses;
  return (
    <Modal title={`${row ? "Edit" : "Create"} ${kind}`} onClose={onClose}>
      <form className="director-form" onSubmit={submit}>
        <label className="director-field director-field-wide">
          {kind === "task" ? "Task name" : "Project name"} *
          <input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} placeholder={kind === "task" ? "e.g. Approve the September campaign" : "e.g. New client launch"} />
        </label>
        <label className="director-field director-field-wide">
          Brief / description
          <textarea rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Add context, outcome and handoff notes…" />
        </label>
        <div className="director-form-grid">
          <label className="director-field">
            Status
            <select value={form.status} onChange={(event) => update("status", event.target.value)}>
              {statusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {kind === "task" && (
            <label className="director-field">
              Priority
              <select value={form.priority} onChange={(event) => update("priority", event.target.value)}>
                {["Low", "Medium", "High", "Urgent"].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          )}
          <label className="director-field">
            Space
            <select value={form.spaceId} onChange={(event) => update("spaceId", event.target.value)}>
              {spaces.map((space) => <option value={space.id} key={space.id}>{space.name}</option>)}
            </select>
          </label>
          <label className="director-field">
            Department
            <select value={form.department} onChange={(event) => update("department", event.target.value)}>
              {departments.map((department) => <option key={department}>{department}</option>)}
            </select>
          </label>
          <label className="director-field">
            {kind === "task" ? "Assignee" : "Project owner"}
            <select value={form.assignee} onChange={(event) => update("assignee", event.target.value)}>
              <option value="">Unassigned</option>
              {people.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}
            </select>
          </label>
          <label className="director-field">
            {kind === "task" ? "Project" : "Client"}
            <select value={kind === "task" ? form.projectId : form.clientId} onChange={(event) => update(kind === "task" ? "projectId" : "clientId", event.target.value)}>
              <option value="">No {kind === "task" ? "project" : "client"}</option>
              {(kind === "task" ? projects : clients).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </label>
          {kind === "task" && (
            <label className="director-field">
              Client
              <select value={form.clientId} onChange={(event) => update("clientId", event.target.value)}>
                <option value="">No client</option>
                {clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
              </select>
            </label>
          )}
          <label className="director-field">
            Start date
            <input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} />
          </label>
          <label className="director-field">
            Due date
            <input type="date" value={form.due} onChange={(event) => update("due", event.target.value)} />
          </label>
          <label className="director-field">
            Estimated hours
            <input type="number" min="0" step="0.5" value={form.hours} onChange={(event) => update("hours", event.target.value)} placeholder="0" />
          </label>
          {kind === "project" && (
            <label className="director-field">
              Budget (₹)
              <input type="number" min="0" step="100" value={form.amount} onChange={(event) => update("amount", event.target.value)} placeholder="0" />
            </label>
          )}
          {kind === "task" && (
            <label className="director-field director-field-wide">
              Tags <span className="director-label-note">comma separated</span>
              <input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="Client delivery, Focus" />
            </label>
          )}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="director-form-actions">
          <Button type="button" className="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit"><CheckCircle2 size={16} /> {row ? "Save changes" : `Create ${kind}`}</Button>
        </div>
      </form>
    </Modal>
  );
}

function TaskRow({
  task,
  project,
  assignee,
  onOpen,
  onEdit,
}: {
  task: Entity;
  project?: Entity;
  assignee?: Entity;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const overdue = isOverdue(task);
  return (
    <article className={`director-task-row ${task.status === "Completed" ? "is-complete" : ""}`}>
      <button className="director-task-main" onClick={onOpen}>
        <span className={`director-priority priority-${String(task.priority || "Medium").toLowerCase()}`} aria-hidden="true" />
        <span className="director-task-copy">
          <strong>{task.name}</strong>
          <small>{project?.name || "Unlinked work"} · {task.department || task.team_id || "Creative workspace"}</small>
          {tagsFor(task).length > 0 && <span className="director-tag-line">{tagsFor(task).slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}</span>}
        </span>
      </button>
      <Badge value={String(task.status || "To Do")} />
      <span className={`director-due ${overdue ? "overdue" : ""}`}><Clock3 size={14} /> {overdue ? "Overdue" : dateLabel(task.due)}</span>
      <span className="director-assignee">{assignee ? <Avatar name={assignee.name} role={assignee.role} /> : <span className="director-unassigned">—</span>}</span>
      <button className="icon-btn" aria-label={`Edit ${task.name}`} onClick={onEdit}><MoreHorizontal size={18} /></button>
    </article>
  );
}

function BoardCard({ task, onOpen }: { task: Entity; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 5 : undefined } : undefined;
  return (
    <article ref={setNodeRef} style={style} className={`director-board-card ${isDragging ? "is-dragging" : ""}`}>
      <div className="director-board-card-top">
        <span className={`director-priority priority-${String(task.priority || "Medium").toLowerCase()}`} />
        <button className="director-drag-handle" {...listeners} {...attributes} aria-label={`Drag ${task.name}`}>⠿</button>
      </div>
      <button className="director-board-title" onClick={onOpen}>{task.name}</button>
      <div className="director-board-meta"><Badge value={String(task.priority || "Medium")} /><span>{dateLabel(task.due)}</span></div>
      <div className="director-board-foot"><small>{task.department || "Creative"}</small>{task.assignee ? <Avatar name={String(task.assignee)} /> : <span className="director-unassigned">—</span>}</div>
    </article>
  );
}

function BoardColumn({ status, tasks, onOpen }: { status: string; tasks: Entity[]; onOpen: (task: Entity) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className={`director-board-column ${isOver ? "is-over" : ""}`}>
      <header><span className={`director-status-dot status-${slug(status)}`} /><strong>{status}</strong><b>{tasks.length}</b></header>
      <div className="director-board-column-body">
        {tasks.map((task) => <BoardCard key={task.id} task={task} onOpen={() => onOpen(task)} />)}
        {!tasks.length && <span className="director-drop-hint">Drop work here</span>}
      </div>
    </section>
  );
}

function GoalCard({ goal }: { goal: Entity }) {
  const percent = Math.max(0, Math.min(100, Number(goal.progress || 0)));
  return (
    <article className="director-goal-card">
      <div className="director-goal-icon"><Target size={17} /></div>
      <div className="director-goal-copy"><div><strong>{goal.name}</strong><Badge value={String(goal.status || "In progress")} /></div><p>{goal.description}</p><div className="director-goal-progress"><i style={{ width: `${percent}%` }} /></div><small>{percent}% complete</small></div>
    </article>
  );
}

function DirectorOverview({
  tasks,
  projects,
  teamLoads,
  goals,
  activity,
  onOpenTask,
}: {
  tasks: Entity[];
  projects: Entity[];
  teamLoads: Array<{ person: Entity; hours: number; open: number; percent: number }>;
  goals: Entity[];
  activity: Entity[];
  onOpenTask: (task: Entity) => void;
}) {
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const focusTasks = tasks.filter((task) => task.status !== "Completed").sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority) || dateKey(a.due).localeCompare(dateKey(b.due))).slice(0, 6);
  const healthProjects = projects.slice().sort((a, b) => Number(b.status === "At Risk") - Number(a.status === "At Risk") || progressFor(a.id, tasks) - progressFor(b.id, tasks)).slice(0, 6);
  return (
    <>
      <div className="director-overview-grid">
        <article className="director-card director-focus-card">
          <div className="director-card-heading"><div><span className="eyebrow"><Command size={14} /> FOCUS QUEUE</span><h2>Work that needs a decision</h2></div><Link to="/tasks">Open tasks <ArrowRight size={15} /></Link></div>
          {focusTasks.length ? <div className="director-focus-list">{focusTasks.map((task) => <button className="director-focus-row" key={task.id} onClick={() => onOpenTask(task)}><span className={`director-priority priority-${String(task.priority || "Medium").toLowerCase()}`} /><span><strong>{task.name}</strong><small>{projectMap.get(String(task.project_id))?.name || "Unlinked work"} · {dateLabel(task.due)}</small></span><Badge value={String(task.status || "To Do")} /><ChevronRight size={15} /></button>)}</div> : <Empty title="The queue is clear" description="No open work needs your attention in this space." />}
        </article>

        <article className="director-card director-health-card">
          <div className="director-card-heading"><div><span className="eyebrow"><Gauge size={14} /> PORTFOLIO HEALTH</span><h2>Projects in motion</h2></div><Link to="/projects">View all <ArrowRight size={15} /></Link></div>
          <div className="director-project-health-list">{healthProjects.map((project) => { const progress = progressFor(project.id, tasks); const projectRisk = project.status === "At Risk" || tasks.some((task) => task.project_id === project.id && isOverdue(task)); return <Link className="director-project-health" to="/projects" key={project.id}><span className="director-project-health-icon"><FolderKanban size={16} /></span><span><strong>{project.name}</strong><small>{project.department || "Agency"} · {progress}% delivered</small><span className="director-mini-progress"><i style={{ width: `${progress}%` }} /></span></span><Badge value={projectRisk ? "At Risk" : String(project.status || "Active")} /></Link>; })}</div>
        </article>
      </div>

      <div className="director-overview-lower">
        <article className="director-card">
          <div className="director-card-heading"><div><span className="eyebrow"><Users size={14} /> TEAM CAPACITY</span><h2>Where the energy is going</h2></div><Link to="/workload">Open workload <ArrowRight size={15} /></Link></div>
          <div className="director-capacity-list">{teamLoads.slice(0, 6).map(({ person, hours, open, percent }) => <Link to="/workload" className="director-capacity-row" key={person.id}><Avatar name={person.name} role={person.role} /><span><strong>{person.name}</strong><small>{person.department || person.team_id || "Team"} · {open} open tasks</small></span><span className="director-capacity-meter"><i className={percent > 100 ? "risk" : ""} style={{ width: `${Math.min(percent, 100)}%` }} /></span><b>{hours}h</b></Link>)}</div>
        </article>
        <article className="director-card">
          <div className="director-card-heading"><div><span className="eyebrow"><Target size={14} /> GOALS</span><h2>Company-level momentum</h2></div><Link to="/reports">Reports <ArrowRight size={15} /></Link></div>
          <div className="director-goal-list">{goals.slice(0, 3).map((goal) => <GoalCard key={goal.id} goal={goal} />)}</div>
        </article>
      </div>

      <article className="director-card director-activity-card">
        <div className="director-card-heading"><div><span className="eyebrow"><Activity size={14} /> RECENT ACTIVITY</span><h2>Everything important, in one feed</h2></div><Link to="/activity_logs">Audit log <ArrowRight size={15} /></Link></div>
        {activity.length ? <div className="director-activity-list">{activity.slice(0, 7).map((item) => <div className="director-activity-row" key={item.id}><span className="director-activity-dot"><CircleDot size={15} /></span><span><strong>{item.name}</strong><small>{item.description ? String(item.description).slice(0, 100) : "Workspace activity recorded"}</small></span><time>{dateLabel(item.created_at)}</time></div>)}</div> : <Empty title="Your activity feed is ready" description="Create or update work to see the workspace rhythm here." />}
      </article>
    </>
  );
}

export default function DirectorDashboard() {
  const { user, data, save } = useWorkspace();
  const [activeSpace, setActiveSpace] = useState("everything");
  const [view, setView] = useState<DirectorView>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [composer, setComposer] = useState<{ kind: ComposerKind; row?: Entity } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Entity | null>(null);
  const [actionError, setActionError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const projects = data.projects || [];
  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const spaces = useMemo(() => (data.spaces || []).length ? data.spaces : DEFAULT_SPACES, [data.spaces]);
  const tasks = useMemo(() => scoped(data.tasks || [], user), [data.tasks, user]);
  const employees = data.employees || [];
  const today = new Date().toISOString().slice(0, 10);

  const spaceTasks = useMemo(() => tasks.filter((task) => activeSpace === "everything" || resolveSpaceId(task, projectMap) === activeSpace), [tasks, activeSpace, projectMap]);
  const visibleProjects = useMemo(() => projects.filter((project) => activeSpace === "everything" || resolveSpaceId(project, projectMap) === activeSpace), [projects, activeSpace, projectMap]);
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return spaceTasks.filter((task) => {
      const project = projectMap.get(String(task.project_id || ""));
      const assignee = employees.find((person) => person.id === task.assignee);
      const haystack = [task.name, task.description, task.department, task.priority, project?.name, assignee?.name, ...tagsFor(task)].filter(Boolean).join(" ").toLowerCase();
      return (!query || haystack.includes(query)) &&
        (statusFilter === "All" || task.status === statusFilter) &&
        (priorityFilter === "All" || task.priority === priorityFilter) &&
        (assigneeFilter === "All" || task.assignee === assigneeFilter);
    });
  }, [spaceTasks, search, statusFilter, priorityFilter, assigneeFilter, projectMap, employees]);

  const completed = spaceTasks.filter((task) => task.status === "Completed").length;
  const openTasks = spaceTasks.filter((task) => task.status !== "Completed");
  const overdue = openTasks.filter((task) => isOverdue(task, today));
  const review = spaceTasks.filter((task) => task.status === "Internal Review" || task.status === "Revision");
  const completion = Math.round((completed / Math.max(spaceTasks.length, 1)) * 100);
  const collected = (data.invoices || []).filter((invoice) => invoice.status === "Paid").reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const soon = openTasks.filter((task) => dateKey(task.due) >= today && dateKey(task.due) <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).length;
  const totalOpenHours = openTasks.reduce((sum, task) => sum + Number(task.hours || 0), 0);
  const capacity = employees.length ? Math.round((totalOpenHours / (employees.length * 40)) * 100) : 0;

  const metrics: Metric[] = [
    { label: "Open tasks", value: openTasks.length, note: `${soon} due in the next 7 days`, icon: CheckCircle2, tone: "blue" },
    { label: "Delivery rate", value: `${completion}%`, note: `${completed} completed in this space`, icon: TrendingUp, tone: "green" },
    { label: "At-risk items", value: overdue.length, note: overdue.length ? "Needs a decision today" : "No overdue work", icon: AlertTriangle, tone: "red" },
    { label: "Team capacity", value: `${capacity}%`, note: `${totalOpenHours}h of active workload`, icon: Users, tone: "violet" },
    { label: "Collected", value: currency(collected), note: "Paid client invoices", icon: Wallet, tone: "amber" },
  ];

  const teamLoads = useMemo(() => employees.map((person) => {
    const assigned = spaceTasks.filter((task) => task.assignee === person.id && task.status !== "Completed");
    const hours = assigned.reduce((sum, task) => sum + Number(task.hours || 0), 0);
    return { person, hours, open: assigned.length, percent: Math.round((hours / 40) * 100) };
  }).sort((a, b) => b.percent - a.percent || b.open - a.open), [employees, spaceTasks]);

  const goals = (data.goals || []).length ? data.goals || [] : visibleProjects.slice(0, 3).map((project) => ({
    id: `goal-${project.id}`,
    name: project.name,
    status: project.status,
    progress: progressFor(project.id, spaceTasks),
    description: project.description,
  }));
  const activity = (data.activity_logs || []).slice().sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  const calendarDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarOffset = (calendarMonth.getDay() + 6) % 7;
  const calendarCells = Array.from({ length: calendarOffset + calendarDays }, (_, index) => {
    if (index < calendarOffset) return null;
    const day = index - calendarOffset + 1;
    return `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setAssigneeFilter("All");
  };

  async function handleDragEnd(event: DragEndEvent) {
    const nextStatus = event.over ? String(event.over.id) : "";
    const task = tasks.find((item) => item.id === String(event.active.id));
    if (!task || !statuses.includes(nextStatus) || task.status === nextStatus) return;
    try {
      await save("tasks", { ...task, status: nextStatus });
      setActionError("");
    } catch (cause) {
      setActionError((cause as Error).message);
    }
  }

  const viewTitle = view === "overview" ? "Director overview" : `${view.charAt(0).toUpperCase()}${view.slice(1)} view`;
  const hasFilters = Boolean(search || statusFilter !== "All" || priorityFilter !== "All" || assigneeFilter !== "All");

  if (!user) return null;

  return (
    <div className="director-page">
      <header className="director-header">
        <div>
          <span className="eyebrow"><Command size={14} /> DIRECTOR COMMAND CENTER</span>
          <div className="director-title-line"><h1>Everything is moving.</h1><span className="director-live-pill"><i /> Live workspace</span></div>
          <p>One ClickUp-style view for people, projects, tasks, goals and the decisions shaping Creative Adhyayan.</p>
        </div>
        <div className="director-header-actions">
          <Button className="secondary" onClick={() => setComposer({ kind: "project" })}><FolderKanban size={16} /> New project</Button>
          <Button onClick={() => setComposer({ kind: "task" })}><Plus size={17} /> New task</Button>
        </div>
      </header>

      <div className="director-layout">
        <aside className="director-space-rail" aria-label="Workspace spaces">
          <div className="director-rail-heading"><span>WORKSPACE</span><button className="icon-btn" aria-label="Add a space" onClick={() => setComposer({ kind: "project" })}><Plus size={16} /></button></div>
          <div className="director-space-list">
            <button className={`director-space-item ${activeSpace === "everything" ? "active" : ""}`} onClick={() => { setActiveSpace("everything"); setView("overview"); }}><span className="director-space-icon everything"><LayersIcon /></span><span><strong>Everything</strong><small>{tasks.length} tasks · {projects.length} projects</small></span></button>
            {spaces.map((space) => { const count = tasks.filter((task) => resolveSpaceId(task, projectMap) === space.id).length; return <button className={`director-space-item ${activeSpace === space.id ? "active" : ""}`} key={space.id} onClick={() => { setActiveSpace(space.id); setView("list"); }}><span className="director-space-icon" style={{ background: `${initialsColor(space)}18`, color: initialsColor(space) }}><CircleDot size={17} /></span><span><strong>{space.name}</strong><small>{count} tasks · {space.status || "Active"}</small></span><ChevronRight size={14} /></button>; })}
          </div>
          <div className="director-rail-divider" />
          <span className="director-rail-label">WORKSPACE TOOLS</span>
          <nav className="director-tool-links">
            <Link to="/projects"><FolderKanban size={16} /> Projects <ChevronRight size={14} /></Link>
            <Link to="/people"><Users size={16} /> People & roles <ChevronRight size={14} /></Link>
            <Link to="/reports"><BarChart3 size={16} /> Reports <ChevronRight size={14} /></Link>
            <Link to="/settings"><SlidersHorizontal size={16} /> Settings <ChevronRight size={14} /></Link>
          </nav>
          <div className="director-rail-note"><Timer size={17} /><span><strong>Stay ahead</strong><small>{review.length} work items are in review.</small></span></div>
        </aside>

        <section className="director-main-column">
          <section className="director-kpi-grid" aria-label="Director workspace metrics">
            {metrics.map(({ label, value, note, icon: Icon, tone }) => <article className={`director-kpi director-kpi-${tone}`} key={label}><span className="director-kpi-icon"><Icon size={18} /></span><span className="director-kpi-label">{label}</span><strong>{value}</strong><small>{note}</small></article>)}
          </section>

          <section className="director-control-card">
            <div className="director-filter-row">
              <div className="director-search"><Search size={17} /><input aria-label="Search director workspace" placeholder="Search tasks, projects, people or tags…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <select aria-label="Filter task status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
              <select aria-label="Filter task priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>All</option>{["Urgent", "High", "Medium", "Low"].map((priority) => <option key={priority}>{priority}</option>)}</select>
              <select aria-label="Filter task assignee" value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option value="All">Everyone</option>{employees.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select>
              {hasFilters && <button className="director-clear-filter" onClick={clearFilters}>Clear</button>}
              <Button className="secondary director-export" onClick={() => exportCSV(filteredTasks, "creative-adhyayan-director-tasks")}><BarChart3 size={15} /> Export</Button>
            </div>
            <div className="director-view-row"><div><span className="director-view-label">{activeSpace === "everything" ? "Everything" : spaces.find((space) => space.id === activeSpace)?.name || "Space"}</span><span className="director-result-count">{filteredTasks.length} tasks · {visibleProjects.length} projects</span></div><div className="director-view-tabs" role="tablist" aria-label="Workspace views">{viewOptions.map((option) => { const Icon = option.icon; return <button key={option.id} className={view === option.id ? "active" : ""} onClick={() => setView(option.id)} role="tab" aria-selected={view === option.id}><Icon size={15} /> <span>{option.label}</span></button>; })}</div></div>
          </section>

          {actionError && <div className="director-action-error" role="alert">{actionError}</div>}

          {view === "overview" && <DirectorOverview tasks={spaceTasks} projects={visibleProjects} teamLoads={teamLoads} goals={goals} activity={activity} onOpenTask={setSelectedTask} />}

          {view === "list" && (
            <section className="director-card director-list-card">
              <div className="director-card-heading"><div><span className="eyebrow"><ListIcon size={14} /> WORK LIST</span><h2>{viewTitle}</h2></div><Button onClick={() => setComposer({ kind: "task" })}><Plus size={16} /> Add task</Button></div>
              <div className="director-list-head"><span>Task</span><span>Status</span><span>Due</span><span>Owner</span><span /></div>
              {filteredTasks.length ? filteredTasks.map((task) => <TaskRow key={task.id} task={task} project={projectMap.get(String(task.project_id || ""))} assignee={employees.find((person) => person.id === task.assignee)} onOpen={() => setSelectedTask(task)} onEdit={() => setComposer({ kind: "task", row: task })} />) : <Empty title="No matching tasks" description="Change the filters or create a new task for this space." />}
            </section>
          )}

          {view === "board" && <section className="director-card director-board-shell"><div className="director-card-heading"><div><span className="eyebrow"><KanbanSquare size={14} /> DRAG AND DROP WORKFLOW</span><h2>Task board</h2></div><span className="director-board-tip">Drag a card to change its status</span></div><DndContext onDragEnd={handleDragEnd}><div className="director-board">{statuses.map((status) => <BoardColumn key={status} status={status} tasks={filteredTasks.filter((task) => task.status === status)} onOpen={setSelectedTask} />)}</div></DndContext></section>}

          {view === "calendar" && <section className="director-card director-calendar-shell"><div className="director-card-heading"><div><span className="eyebrow"><CalendarDays size={14} /> DEADLINE MAP</span><h2>{calendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2></div><div className="director-calendar-actions"><Button className="secondary" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>Previous</Button><Button className="secondary" onClick={() => setCalendarMonth(new Date())}>Today</Button><Button className="secondary" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>Next</Button></div></div><div className="director-calendar-grid">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div className="director-calendar-label" key={day}>{day}</div>)}{calendarCells.map((day, index) => <div className={`director-calendar-cell ${day === today ? "today" : ""}`} key={day || `blank-${index}`}>{day && <><strong>{Number(day.slice(-2))}</strong>{filteredTasks.filter((task) => dateKey(task.due) === day).slice(0, 4).map((task) => <button className={`director-calendar-task ${isOverdue(task, today) ? "overdue" : ""}`} key={task.id} onClick={() => setSelectedTask(task)}><i />{task.name}</button>)}</>}</div>)}</div></section>}

          {view === "timeline" && <section className="director-card director-timeline-shell"><div className="director-card-heading"><div><span className="eyebrow"><BarChart3 size={14} /> DELIVERY ROADMAP</span><h2>Timeline</h2></div><span className="director-board-tip">Sorted by deadline · {filteredTasks.length} items</span></div><div className="director-timeline">{filteredTasks.slice().sort((a, b) => dateKey(a.due).localeCompare(dateKey(b.due))).map((task) => { const progress = task.status === "Completed" ? 100 : task.status === "In Progress" ? 58 : task.status === "Internal Review" ? 82 : task.status === "Revision" ? 70 : 18; return <button className="director-timeline-row" key={task.id} onClick={() => setSelectedTask(task)}><span className="director-timeline-date">{dateLabel(task.due)}<small>{fullDateLabel(task.due)}</small></span><span className="director-timeline-track"><i style={{ width: `${progress}%` }} /><b style={{ left: `${Math.max(4, Math.min(progress, 94))}%` }} /></span><span className="director-timeline-copy"><strong>{task.name}</strong><small>{projectMap.get(String(task.project_id || ""))?.name || "Unlinked work"} · {task.status}</small></span><ChevronRight size={15} /></button>; })}</div>{!filteredTasks.length && <Empty title="No timeline items" description="Create work or adjust your filters to see the roadmap." />}</section>}

          {view === "workload" && <section className="director-card director-workload-shell"><div className="director-card-heading"><div><span className="eyebrow"><Users size={14} /> PEOPLE AND CAPACITY</span><h2>Team workload</h2></div><Link className="btn secondary" to="/workload">Open full workload <ArrowRight size={15} /></Link></div><div className="director-workload-grid">{teamLoads.map(({ person, hours, open, percent }) => <article className="director-workload-card" key={person.id}><div className="director-workload-head"><Avatar name={person.name} role={person.role} /><span><strong>{person.name}</strong><small>{person.department || person.team_id || "Team"}</small></span><Badge value={percent > 100 ? "Overloaded" : percent < 60 ? "Available" : "Balanced"} /></div><div className="director-workload-number"><strong>{percent}%</strong><span>{hours}h planned · {open} open tasks</span></div><div className="director-workload-bar"><i className={percent > 100 ? "risk" : ""} style={{ width: `${Math.min(percent, 100)}%` }} /></div><Link to="/people">View profile <ArrowRight size={14} /></Link></article>)}</div>{!teamLoads.length && <Empty title="No people found" description="Add team members to see capacity here." />}</section>}
        </section>
      </div>

      {composer && <DirectorComposer key={`${composer.kind}-${composer.row?.id || "new"}`} kind={composer.kind} row={composer.row} spaces={spaces} defaultSpaceId={activeSpace === "everything" ? spaces[0]?.id || "" : activeSpace} onClose={() => setComposer(null)} />}
      {selectedTask && <TaskPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function LayersIcon() {
  return <span className="director-layers-icon"><span /><span /><span /></span>;
}
