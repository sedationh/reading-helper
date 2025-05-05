import { Editor, Viewer } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { useMemo, useState } from "react";
import * as LZString from "lz-string";
import { useNavigate, useSearchParams } from "react-router-dom";

const EditorView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const content = searchParams.get('content');
  const [isEditing, setIsEditing] = useState<boolean>(!content);
  const value = useMemo(() => {
    if (!content) return "";
    return LZString.decompressFromEncodedURIComponent(content);
  }, [content]);

  // 将内容同步到 URL query
  const handleChange = (newValue: string) => {
    if (newValue === "") {
      navigate("/");
      return;
    }
    const compressed = LZString.compressToEncodedURIComponent(newValue);
    navigate(`/?content=${compressed}`);
  };

  return (
    <div className="container">
      <h1
        onClick={() => {
          navigate("/");
          setIsEditing(true);
        }}
      >
        Reading Helper
      </h1>
      <div className="editor-header">
        {isEditing ? (
          <>
            <button onClick={() => setIsEditing(false)}>Preview</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)}>Edit</button>
        )}
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
