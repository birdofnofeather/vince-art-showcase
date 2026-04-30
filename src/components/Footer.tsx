const Footer = () => (
  <footer className="border-t border-border py-8">
    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-light">
      <span>© 2026 Vince de Yaanga. All rights reserved.</span>
      <div className="flex gap-6">
        <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
        <a href="#" className="hover:text-foreground transition-colors">Behance</a>
      </div>
    </div>
  </footer>
);

export default Footer;
