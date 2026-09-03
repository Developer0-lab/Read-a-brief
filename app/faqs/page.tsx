import Link from 'next/link'
import PublicFooter from '@/app/components/public-footer'

const faqs = [
  ['What is Read-a-Brief?', 'Read-a-Brief is a news intelligence platform that organizes important developments into concise, source-attributed briefings.'],
  ['Where does the information come from?', 'We monitor approved news feeds and APIs and retain source information so readers can trace a briefing back to its sources.'],
  ['Does Read-a-Brief republish articles?', 'No. The platform is designed around original synthesis and attribution rather than verbatim republication of protected articles.'],
  ['How often is the site updated?', 'Sources can be monitored automatically according to their configured schedules. New stories then move through the editorial workflow before publication.'],
  ['Can I suggest a source?', 'Yes. Use the Contact page to suggest a reputable news source or report an issue with an existing briefing.'],
]

export default function FAQsPage() {
  return <main className="site"><header className="simple-page-header"><Link className="brand" href="/">READ-A-BRIEF</Link></header><article className="info-page"><div className="eyebrow">FAQS</div><h1>Frequently asked questions.</h1><div className="faq-list">{faqs.map(([q,a])=><section className="faq-item" key={q}><h2>{q}</h2><p>{a}</p></section>)}</div></article><PublicFooter /></main>
}
