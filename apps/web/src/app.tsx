import { useEffect } from "react";
import { HomePage } from "./pages/HomePage";
import { initFirebase } from "./lib/firebase";

function App() {
  useEffect(() => {
    initFirebase();
  }, []);

  return <HomePage />;
}

export default App;
