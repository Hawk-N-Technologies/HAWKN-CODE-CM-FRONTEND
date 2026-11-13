import { Link } from "react-router-dom";

export default function AppHeader() {
  return (
    <header className="bg-cm-navy-950 text-cm-text-inverse">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span>AMPL Packing</span>
        </Link>
        <span className="text-xs text-cm-blue-100/80">Hawk N Technologies</span>
      </div>
    </header>
  );
}
