import Link from 'next/link'
import PublicFooter from '@/app/components/public-footer'

export default function TermsPage() {
  return <main className="site"><header className="simple-page-header"><Link className="brand" href="/">READ-A-BRIEF</Link></header><article className="info-page"><div className="eyebrow">LEGAL</div><h1>Terms of Use</h1><p className="info-lead">By using Read-a-Brief, you agree to use the service responsibly and in accordance with applicable laws.</p><h2>Content</h2><p>Read-a-Brief provides original summaries and links to source material for informational purposes. Source content remains subject to the rights and policies of its respective publishers.</p><h2>Acceptable use</h2><p>Do not misuse the service, attempt to bypass security controls, interfere with automated systems, or use the platform for unlawful activity.</p><h2>Availability</h2><p>We work to keep the service reliable, but availability and individual features may change as the platform develops.</p><h2>Contact</h2><p>Questions about these terms can be sent through the Contact page.</p></article><PublicFooter /></main>
}
