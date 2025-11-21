import { HomePage } from "./pages/HomePage";
import { initFirebase } from "./lib/firebase";

initFirebase();

function App() {
  return <HomePage />;
}

export default App;
