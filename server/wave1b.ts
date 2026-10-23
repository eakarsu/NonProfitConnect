// Wave 1B: owner-scoped tasks (process-local store, no DB migration) and
// CSV/JSON serializers preserving false/0/empty values.
import { randomUUID } from "node:crypto";
export type TaskStatus = "open" | "in_progress" | "done";
export interface WaveTask { id: string; ownerId: string; title: string; notes: string; status: TaskStatus; dueDate: string | null; createdAt: string; updatedAt: string }
const STATUSES = new Set<TaskStatus>(["open", "in_progress", "done"]);
export function createTaskStore() {
  const tasks = new Map<string, WaveTask>();
  return {
    list(ownerId: string, filter: { status?: string; search?: string } = {}): WaveTask[] {
      let out = [...tasks.values()].filter((t) => t.ownerId === String(ownerId));
      if (filter.status) out = out.filter((t) => t.status === filter.status);
      if (filter.search) { const q = filter.search.toLowerCase(); out = out.filter((t) => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)); }
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    create(ownerId: string, input: { title?: unknown; notes?: unknown; status?: string; dueDate?: string | null }): WaveTask {
      const title = String(input.title ?? "").trim();
      if (!title || title.length > 200) throw Object.assign(new Error("title must be 1-200 characters"), { status: 400, code: "VALIDATION_ERROR" });
      const status = (input.status || "open") as TaskStatus;
      if (!STATUSES.has(status)) throw Object.assign(new Error("status is invalid"), { status: 400, code: "VALIDATION_ERROR" });
      const now = new Date().toISOString();
      const task: WaveTask = { id: randomUUID(), ownerId: String(ownerId), title, notes: input.notes ? String(input.notes).slice(0, 2000) : "", status, dueDate: input.dueDate ?? null, createdAt: now, updatedAt: now };
      tasks.set(task.id, task); return task;
    },
    update(ownerId: string, id: string, patch: { title?: unknown; notes?: unknown; status?: string; dueDate?: string | null }): WaveTask | null {
      const task = tasks.get(String(id));
      if (!task || task.ownerId !== String(ownerId)) return null;
      if (patch.title !== undefined) { const t = String(patch.title).trim(); if (!t || t.length > 200) throw Object.assign(new Error("title must be 1-200 characters"), { status: 400, code: "VALIDATION_ERROR" }); task.title = t; }
      if (patch.notes !== undefined) task.notes = String(patch.notes).slice(0, 2000);
      if (patch.status !== undefined) { if (!STATUSES.has(patch.status as TaskStatus)) throw Object.assign(new Error("status is invalid"), { status: 400, code: "VALIDATION_ERROR" }); task.status = patch.status as TaskStatus; }
      if (patch.dueDate !== undefined) task.dueDate = patch.dueDate ?? null;
      task.updatedAt = new Date().toISOString(); return task;
    },
  };
}
export function csvCell(value: unknown): string { if (value === null || value === undefined) return ""; const s = typeof value === "object" ? JSON.stringify(value) : String(value); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
export const PROJECT_COLUMNS = [{ label: "Title", accessor: "title" }, { label: "Category", accessor: "category" }, { label: "Requested Amount", accessor: "requestedAmount" }, { label: "Status", accessor: "status" }, { label: "Priority", accessor: "priority" }] as const;
export function projectsToCsv(projects: any[]): string { return [PROJECT_COLUMNS.map((c) => c.label).join(","), ...projects.map((p) => PROJECT_COLUMNS.map((c) => csvCell(p[c.accessor])).join(","))].join("\n"); }
export const taskStore = createTaskStore();
