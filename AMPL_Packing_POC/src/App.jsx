import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import NotFoundPage from "./pages/NotFoundPage";
import SystemStatusPage from "./pages/SystemStatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <Routes>
          <Route path="/" element={<SystemStatusPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
