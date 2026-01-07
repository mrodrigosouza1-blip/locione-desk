import { useLocation } from "react-router-dom";

export default function LayoutDebugBar() {
  const loc = useLocation();
  return (
    <div style={{ padding: "8px", fontSize: "12px", opacity: 0.7, backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
      Route: {loc.pathname}
    </div>
  );
}
