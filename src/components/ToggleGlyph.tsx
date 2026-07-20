import { useNavigate, useLocation } from "react-router-dom";

/* Shake + glow at first load, then every 5s. Removed for reduced-motion. */
const glyphCss = `
@keyframes glyph-nudge {
  0%   { transform: rotate(0deg); filter: none; }
  3%   { transform: rotate(-14deg); filter: drop-shadow(0 0 5px rgba(110, 190, 255, 0.95)); }
  6%   { transform: rotate(11deg);  filter: drop-shadow(0 0 8px rgba(110, 190, 255, 0.75)); }
  9%   { transform: rotate(-8deg);  filter: drop-shadow(0 0 6px rgba(110, 190, 255, 0.55)); }
  12%  { transform: rotate(5deg); }
  15%  { transform: rotate(0deg); filter: none; }
  100% { transform: rotate(0deg); filter: none; }
}
.glyph-attn {
  display: inline-block;
  transform-origin: 50% 50%;
  animation: glyph-nudge 5s ease-in-out 0s infinite;
}
@media (prefers-reduced-motion: reduce) {
  .glyph-attn { animation: none; }
}
`;

const ToggleGlyph = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inAtelier = location.pathname.startsWith("/atelier");

  return (
    <button
      type="button"
      aria-label={inAtelier ? "Back to portfolio" : "Enter atelier"}
      onClick={() => navigate(inAtelier ? "/" : "/atelier")}
      className="leading-none bg-transparent border-0 outline-none focus-visible:ring-1 focus-visible:ring-current rounded"
      style={{ fontSize: "1.2em" }}
    >
      {!inAtelier && <style>{glyphCss}</style>}
      <span aria-hidden="true" className={inAtelier ? undefined : "glyph-attn"}>
        {inAtelier ? "🎨" : "🤖"}
      </span>
    </button>
  );
};

export default ToggleGlyph;
