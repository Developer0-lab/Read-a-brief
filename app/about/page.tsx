import Link from 'next/link'
import PublicFooter from '@/app/components/public-footer'

export default function AboutPage() {
  return <main className="site"><header className="simple-page-header"><Link className="brand" href="/">READ-A-BRIEF</Link></header><article className="info-page"><div className="eyebrow">ABOUT</div><h1>The world. In a few minutes.</h1><p className="info-lead">Read-a-Brief turns important developments from trusted sources into concise, original briefings designed to help you understand what happened and why it matters.</p><h2>Our approach</h2><p>We monitor news sources, organize developing stories, and present source-attributed briefings through an editorial workflow. Our goal is clarity, context and speed—not information overload.</p><h2>Built for understanding</h2><p>Every briefing is designed to give you the essential facts first, with context and source information available when you want to go deeper.</p></article><PublicFooter /></main>
}
