import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const Layout = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header
        className={`sticky top-0 z-50 bg-background transition-[border-color] ${
          scrolled ? "border-b border-border" : "border-b border-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 h-16">
          <Link to="/" className="font-display text-lg md:text-xl tracking-tight">
            Vince de Yaanga
          </Link>
          <nav className="flex items-center gap-8 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              Work
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              About
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="py-10 mt-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-xs text-muted-foreground">
          Vince de Yaanga · Los Angeles · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
