import type { Metadata } from 'next'
import Image from 'next/image'
import ContactForm from './ContactForm'

export const metadata: Metadata = { title: 'Contact' }

export default function ContactPage() {
  return (
    <div className="page-theme page-theme--contact">
      <section className="logo-hero logo-hero--contact">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={400}
          height={400}
          priority
          style={{ objectFit: 'contain', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--contact">
        <div className="container">
          <h2>Get in Touch</h2>
          <p>We&apos;d love to hear from you.</p>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <ContactForm />
        </div>
      </section>
    </div>
  )
}
