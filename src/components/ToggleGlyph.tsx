import { useNavigate, useLocation } from "react-router-dom";

/* Starting 15s after load, the robot glyph gives a brief shake with an
   electric glow every 9s, to invite the atelier visit without shouting.
   Removed entirely for users who prefer reduced motion. */
const glyphCss = `
@keyframes glyph-nudge {
  0%   { transform: rotate(0deg); filter: none; }
  2%   { transform: rotate(-14deg); filter: drop-shadow(0 0 5px rgba(110, 190, 255, 0.95)); }
  4%   { transform: rotate(11deg);  filter: drop-shadow(0 0 8px rgba(110, 190, 255, 0.75)); }
  6%   { transform: rotate(-8deg);  filter: drop-shadow(0 0 6px rgba(110, 190, 255, 0.55)); }
  8%   { transform: rotate(5deg); }
  10%  { transform: rotate(0deg); filter: none; }
  100% { transform: rotate(0deg); filter: none; }
}
.glyph-attn {
  display: inline-block;
  animation: glyph-nudge 9s ease-in-out 15s infinite;
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
      className="text-base leading-none bg-transparent border-0 outline-none focus-visible:ring-1 focus-visible:ring-current rounded"
    >
      {!inAtelier && <style>{glyphCss}</style>}
      <span aria-hidden="true" className={inAtelier ? undefined : "glyph-attn"}>
        {inAtelier ? "🎨" : "🤖"}
      </span>
    </button>
  );
};

export default ToggleGlyph;
