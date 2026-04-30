const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
    <div className="container mx-auto flex items-center justify-between py-4 px-6">
      <a href="#" className="font-heading text-xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
        Vince de Yaanga
      </a>
      <nav className="hidden md:flex gap-8 text-sm font-light tracking-wide">
        <a href="#work" className="text-muted-foreground hover:text-foreground transition-colors">Work</a>
        <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
        <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
      </nav>
    </div>
  </header>
);

export default Header;
