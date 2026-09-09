import { AUTHOR } from '../data/author'
import { AuthorIcon } from './Icons'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <p className="site-footer__disclaimer">
          <strong>Not a medical device.</strong> This model is trained on the Wisconsin
          Breast Cancer dataset for educational purposes. It does not diagnose, and it is
          never a substitute for a qualified clinician.
        </p>

        <div className="site-footer__credit">
          <p className="eyebrow">
            {AUTHOR.role} <strong>{AUTHOR.name}</strong>
          </p>
          <ul className="social">
            {AUTHOR.links.map((link) => (
              <li key={link.label}>
                <a
                  className="social__link"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AuthorIcon label={link.label} />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="eyebrow site-footer__version">
            Breast Cancer Prediction API · v1.0.0
          </p>
        </div>
      </div>
    </footer>
  )
}
