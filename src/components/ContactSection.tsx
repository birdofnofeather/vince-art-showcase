const ContactSection = () => (
  <section id="contact" className="py-24">
    <div className="container mx-auto px-6 max-w-2xl text-center space-y-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Get in Touch</h2>
      <p className="text-muted-foreground font-light">
        For inquiries about exhibitions, commissions, or available works.
      </p>
      <a href="mailto:hello@vincedeyaanga.com" className="inline-block bg-secondary text-secondary-foreground px-8 py-3 text-sm tracking-wide hover:opacity-90 transition-opacity">
        hello@vincedeyaanga.com
      </a>
    </div>
  </section>
);

export default ContactSection;
