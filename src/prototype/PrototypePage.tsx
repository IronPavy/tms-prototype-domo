import { useState, type ReactNode } from "react";
import { AppShell } from "@/design-system";
import { HEADER, NAV_SECTIONS } from "./data";
import DashboardPage from "./DashboardPage";
import TasksPage from "./TasksPage";
import { ScopeProvider } from "./scope";
import { TasksProvider } from "./tasksStore";
import { ReviewLayer } from "@/review/ReviewLayer";

/* Content per sidebar item — add new screens here. `go` switches the selected sidebar item. */
const PAGES: Record<string, (go: (id: string) => void) => ReactNode> = {
  "tasks/dashboard": (go) => <DashboardPage onNavigate={go} />,
  "tasks/tasks": (go) => <TasksPage onNavigate={go} />,
};

/* "Starting screen" (Figma 18:659) with the selected page in the content area. */
export default function PrototypePage() {
  const [selectedId, setSelectedId] = useState("tasks/dashboard");

  return (
    <ScopeProvider>
      <TasksProvider onView={() => setSelectedId("tasks/tasks")}>
        <AppShell
          header={HEADER}
          sidebar={{ sections: NAV_SECTIONS, selectedId, onSelect: setSelectedId }}
        >
          {PAGES[selectedId]?.(setSelectedId)}
        </AppShell>
        <ReviewLayer page={selectedId} />
      </TasksProvider>
    </ScopeProvider>
  );
}
