import { useNavigate, useLocation } from "react-router-dom";

const ToggleGlyph = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inAtelier = location.pathname.startsWith("/atelier");

  return (
    <button
      type="button"
      aria-label="Toggle view"
      onClick={() => navigate(inAtelier ? "/" : "/atelier")}
      className="fixed bottom-3 right-3 z-[100] p-2 bg-transparent border-0 outline-none focus-visible:ring-1 focus-visible:ring-current rounded-full"
      style={{ lineHeight: 0 }}
    >
      <span
        aria-hidden="true"
        className="block rounded-full"
        style={{
          width: 8,
          height: 8,
          backgroundColor: inAtelier ? "#EDEDED" : "#C9C7C0",
        }}
      />
    </button>
  );
};

export default ToggleGlyph;
