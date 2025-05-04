import { Editor, Viewer } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { useEffect, useState } from "react";
import * as LZString from "lz-string";

const EditorView = () => {
  const [value, setValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 从 URL hash 中读取内容
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(hash);
        if (decompressed !== null) {
          setValue(decompressed);
        }
      } catch (err) {
        console.error("Failed to decompress URL hash content:", err);
      }
    }
  }, []);

  // 将内容同步到 URL hash
  const handleChange = (newValue: string) => {
    setValue(newValue);

    const compressed = LZString.compressToEncodedURIComponent(newValue);
    window.location.hash = compressed;
  };

  return (
    <div className="container">
      <h1>Reading Helper</h1>
      <div className="editor-header">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={() => setIsEditing(false)}>Preview</button>
      </div>
      <div className="editor-container">
        {isEditing ? (
          <Editor
            value={value}
            mode="tab"
            plugins={[breaks()]}
            onChange={handleChange}
          />
        ) : (
          <Viewer plugins={[breaks()]} value={value} />
        )}
      </div>
    </div>
  );
};

export default EditorView;
