import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-cm-navy-950">Page not found</h1>
      <p className="mt-2 text-cm-text-muted">This page does not exist in AMPL Packing.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-12 items-center rounded-cm-lg bg-cm-blue-600 px-6 font-semibold text-white hover:bg-cm-blue-700"
      >
        Go to home
      </Link>
    </main>
  );
}
