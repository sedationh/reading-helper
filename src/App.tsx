import EditorView from "./Editor";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <EditorView />
    </BrowserRouter>
  );
}

export default App;
