import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div>
          <div className="footer-brand">READ-A-BRIEF</div>
          <p>The world. In a few minutes.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/about">About</Link>
          <Link href="/faqs">FAQs</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
      <div className="public-footer-bottom">
        <span>© {new Date().getFullYear()} Read-a-Brief. All rights reserved.</span>
        <Link className="footer-admin" href="/auth/login" aria-label="Staff access">•</Link>
      </div>
    </footer>
  )
}
