import { useState, type ReactNode } from "react";
import { HeaderNavbar, type HeaderNavbarProps } from "../organisms/HeaderNavbar";
import { SidebarNavigation, type SidebarNavigationProps } from "../organisms/SidebarNavigation";

export interface AppShellProps {
  header: Omit<HeaderNavbarProps, "onMenuClick">;
  sidebar: SidebarNavigationProps;
  /** page content, rendered in the scrollable area right of the sidebar */
  children?: ReactNode;
}

/** "Starting screen" (Figma 18:659) — header on top, sidebar left, content fills the rest.
    The header's menu button shows / hides the sidebar. */
export function AppShell({ header, sidebar, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-full bg-sp-surface-default">
      <HeaderNavbar {...header} onMenuClick={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 min-h-0">
        {sidebarOpen && <SidebarNavigation {...sidebar} />}
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
