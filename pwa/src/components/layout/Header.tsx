import { NavLink, useLocation } from 'react-router-dom'

function Header() {
  const location = useLocation()

  const navItems = [
    { path: '/plan', label: 'Plan', icon: '🗺️' },
    { path: '/contacts', label: 'Contacts', icon: '👥' },
    { path: '/voice-setup', label: 'Voice', icon: '🎤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <span style={styles.logo}>🛡️</span>
        <span style={styles.title}>SafeRoute+</span>
      </div>
      <nav style={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {})
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: '56px',
    background: '#ffffff',
    borderBottom: '1px solid #eeeeee',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logo: {
    fontSize: '24px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1976d2',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '8px',
    color: '#666666',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    background: '#e3f2fd',
    color: '#1976d2',
  },
  navIcon: {
    fontSize: '16px',
  },
}

export default Header