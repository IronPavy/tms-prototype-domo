import { HeaderButton } from "../molecules/HeaderButton";
import { ProductLogo, TmsLogo } from "../atoms/Logo";

export interface HeaderNavbarProps {
  location: string;
  group: string;
  userEmail: string;
  onMenuClick?: () => void;
  onLocationClick?: () => void;
  onGroupClick?: () => void;
  onUserClick?: () => void;
  onLogout?: () => void;
}

/** Sophi's Pet 3 "Header" (401:2012) — 52px header-background bar: left container (menu button · toolbar, gap 8x),
    right container (toolbar · product logo, gap 4x) with 8x right padding. */
export function HeaderNavbar({
  location, group, userEmail,
  onMenuClick, onLocationClick, onGroupClick, onUserClick, onLogout,
}: HeaderNavbarProps) {
  return (
    <header className="flex items-center justify-between h-[var(--tms-header-height)] bg-sp-header-background overflow-hidden shrink-0">
      {/* Left: menu · location / group switchers · TMS mark */}
      <div className="flex items-center gap-[var(--sp-space-8x)] min-w-0">
        <HeaderButton icon="menu" largeIcon ariaLabel="Menü" onClick={onMenuClick} />
        <div className="flex items-center gap-[var(--sp-space-2x)] min-w-0">
          <HeaderButton icon="marker" label={location} dropdown onClick={onLocationClick} />
          <HeaderButton icon="user_group" label={group} dropdown onClick={onGroupClick} />
          <TmsLogo />
        </div>
      </div>

      {/* Right: utilities · account · logout · product logo */}
      <div className="flex items-center gap-[var(--sp-space-4x)] pr-[var(--sp-space-8x)] shrink-0">
        <div className="flex items-center gap-[var(--sp-space-2x)]">
          <div className="flex items-center">
            <HeaderButton icon="clock" ariaLabel="Zeiterfassung" />
            <HeaderButton icon="sum" ariaLabel="Summen" />
            <HeaderButton icon="mail" ariaLabel="Nachrichten" />
            <HeaderButton icon="user_circle_filled" label={userEmail} dropdown onClick={onUserClick} />
          </div>
          <HeaderButton icon="power" ariaLabel="Abmelden" onClick={onLogout} />
        </div>
        <ProductLogo />
      </div>
    </header>
  );
}
