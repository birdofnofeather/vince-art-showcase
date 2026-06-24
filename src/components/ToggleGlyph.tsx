import { useNavigate, useLocation } from "react-router-dom";

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
      <span aria-hidden="true">{inAtelier ? "🎨" : "🤖"}</span>
    </button>
  );
};

export default ToggleGlyph;
