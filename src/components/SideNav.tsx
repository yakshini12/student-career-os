import { navItems, type NavSurface } from "../navigation";

export function SideNav({
  activeSurface,
  onNavigate,
}: {
  activeSurface: NavSurface;
  onNavigate: (surface: NavSurface) => void;
}) {
  return (
    <nav className="side-nav" aria-label="Workspace">
      <p className="nav-heading">Workspace</p>
      <ul>
        {navItems.map((item) => {
          const active = item.id === activeSurface;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-item${active ? " nav-active" : ""}`}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="nav-note">
        <p>One workspace, computed on read.</p>
        <p className="mono">v1 · local only</p>
      </div>
    </nav>
  );
}
