import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./components/common/Toast";

function App() {
  return (
    <>
      <AppRoutes />
      <ToastProvider />
    </>
  );
}

export default App;