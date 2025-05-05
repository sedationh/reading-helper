import EditorView from "./Editor";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
