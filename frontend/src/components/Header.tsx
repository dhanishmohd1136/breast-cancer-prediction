import { NavLink, Link } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'site-nav__link is-active' : 'site-nav__link'

export default function Header() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link to="/" className="brand" aria-label="Cytology Classifier — home">
          <span className="brand__mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="brand__text">
            Cytology
            <span>Classifier</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <NavLink to="/" className={linkClass} end>
            Overview
          </NavLink>
          <NavLink to="/predict" className={linkClass}>
            Predict
          </NavLink>
        </nav>
      </div>
      <div className="swatch-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </header>
  )
}
