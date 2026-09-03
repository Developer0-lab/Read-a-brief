import Link from 'next/link'
import PublicFooter from '@/app/components/public-footer'

export default function ContactPage() {
  return <main className="site"><header className="simple-page-header"><Link className="brand" href="/">READ-A-BRIEF</Link></header><article className="info-page"><div className="eyebrow">CONTACT</div><h1>Get in touch.</h1><p className="info-lead">Have a source suggestion, correction, partnership idea or question about Read-a-Brief?</p><section className="contact-card"><h2>Send us a message</h2><p>For now, please reach out through the project’s official contact channel. A dedicated contact form and support workflow can be added as the platform grows.</p></section></article><PublicFooter /></main>
}
