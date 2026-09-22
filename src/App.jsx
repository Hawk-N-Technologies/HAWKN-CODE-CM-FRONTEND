import { useState } from "react";
import heroImg from "./assets/hero.png";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import Button from "./components/common/Button";
import { RotateCw } from "lucide-react";
import Loader from "./components/common/Loader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <main className="min-h-screen bg-[#1a1a1a] text-white">
        {/* Hero */}
        <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 text-center">
          <div className="relative mb-8 flex h-48 w-80 items-center justify-center">
            <img
              src={heroImg}
              className="absolute h-[179px] w-[170px] object-contain"
              alt=""
            />

            <img
              src={reactLogo}
              className="absolute left-8 top-6 w-20"
              alt="React logo"
            />

            <img
              src={viteLogo}
              className="absolute bottom-6 right-8 w-20"
              alt="Vite logo"
            />
          </div>

          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Get started Hawk'n
            </h1>

            <p className="text-gray-400">
              Edit <Button>Cancel</Button>
              <code className="rounded bg-gray-800 px-2 py-1 text-sm text-gray-200">
                src/App.jsx
              </code>
              and save to test
              <Loader size="xl" icon={RotateCw} />
              <code className="rounded bg-gray-800 px-2 py-1 text-sm text-gray-200">
                HMR
              </code>
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500 active:scale-95"
            onClick={() => setCount((count) => count + 1)}
          >
            Count is {count}
          </button>
        </section>

        {/* Divider */}
        <div className="h-px w-full bg-gray-800" />

        {/* Next Steps */}
        <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2">
          {/* Documentation */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
            <svg
              className="mb-5 h-10 w-10 text-purple-400"
              role="presentation"
              aria-hidden="true"
            >
              <use href="/icons.svg#documentation-icon" />
            </svg>

            <h2 className="mb-2 text-2xl font-bold">Documentation</h2>

            <p className="mb-6 text-gray-400">Your questions, answered</p>

            <ul className="space-y-3">
              <li>
                <a
                  href="https://vite.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
                >
                  <img
                    className="h-6 w-6 object-contain"
                    src={viteLogo}
                    alt=""
                  />
                  <span>Explore Vite</span>
                </a>
              </li>

              <li>
                <a
                  href="https://react.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
                >
                  <img
                    className="h-6 w-6 object-contain"
                    src={reactLogo}
                    alt=""
                  />
                  <span>Learn more</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
            <svg
              className="mb-5 h-10 w-10 text-blue-400"
              role="presentation"
              aria-hidden="true"
            >
              <use href="/icons.svg#social-icon" />
            </svg>

            <h2 className="mb-2 text-2xl font-bold">Connect with us</h2>

            <p className="mb-6 text-gray-400">Join the Vite community</p>

            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/vitejs/vite"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
                >
                  <svg
                    className="h-6 w-6"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#github-icon" />
                  </svg>
                  <span>GitHub</span>
                </a>
              </li>

              <li>
                <a
                  href="https://chat.vite.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
                >
                  <svg
                    className="h-6 w-6"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#discord-icon" />
                  </svg>
                  <span>Discord</span>
                </a>
              </li>

              <li>
                <a
                  href="https://x.com/vite_js"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
                >
                  <svg
                    className="h-6 w-6"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#x-icon" />
                  </svg>
                  <span>X.com</span>
                </a>
              </li>

              <li>
                <a
                  href="https://bsky.app/profile/vite.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
                >
                  <svg
                    className="h-6 w-6"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href="/icons.svg#bluesky-icon" />
                  </svg>
                  <span>Bluesky</span>
                </a>
              </li>
            </ul>
          </div>
        </section>

        <div className="h-px w-full bg-gray-800" />

        <section className="h-24" />
      </main>
    </>
  );
}

export default App;
