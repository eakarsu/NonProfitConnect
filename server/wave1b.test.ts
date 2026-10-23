import test from "node:test";
import assert from "node:assert/strict";
import { createTaskStore, projectsToCsv } from "./wave1b";
test("tasks are owner-scoped with create/list/update", () => { const s = createTaskStore(); const t = s.create("u1", { title: "Review grant" }); assert.equal(s.list("u1").length, 1); assert.equal(s.list("u2").length, 0); assert.equal(s.update("u2", t.id, { status: "done" }), null); assert.equal(s.update("u1", t.id, { status: "done" })?.status, "done"); });
test("project csv preserves 0 and false", () => { const csv = projectsToCsv([{ title: "A,B", category: "health", requestedAmount: 0, status: false, priority: "high" }]); assert.match(csv, /"A,B",health,0,false,high/); });
