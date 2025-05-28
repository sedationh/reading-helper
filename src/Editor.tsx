import { Editor, Viewer } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { useMemo, useState } from "react";
import * as LZString from "lz-string";
import { useNavigate, useLocation } from "react-router-dom";

const EditorView = () => {
  const navigate = useNavigate();
  const content = useLocation().hash?.slice(1);

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
    // 完整内容用于 query 参数
    const compressed = LZString.compressToEncodedURIComponent(newValue);

    // 截取前 20 个字符用于 path, 只用来区分不同的内容，不包含特殊字符
    const truncatedContent = newValue.slice(0, 20);
    const pathContent = LZString.compressToEncodedURIComponent(
      truncatedContent
    ).replace(/[^a-zA-Z]/g, "");
    navigate(`/${pathContent}#${compressed}`);
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
            <button
              onClick={() => {
                // 合并字幕内容后，按句子分割并累加，尽量不超过80字符分段，避免句子被截断
                const mergeSubtitlesBySentence = (input) => {
                  // 合并所有字幕文本
                  const merged = input
                    .split(/\r?\n/)
                    .filter(
                      (line) =>
                        !/^\d+$/.test(line.trim()) &&
                        !/^\d{2}:\d{2}:\d{2},\d{3}/.test(line.trim()) &&
                        line.trim() !== ""
                    )
                    .join(" ");
                  // 按句子分割（中英文标点）
                  const sentences = merged.match(/[^。！？.!?]+[。！？.!?]?/g) || [];
                  const segments = [];
                  let current = "";
                  for (const sentence of sentences) {
                    if ((current + sentence).length > 80) {
                      if (current) segments.push(current.trim());
                      current = sentence;
                    } else {
                      current += sentence;
                    }
                  }
                  if (current) segments.push(current.trim());
                  return segments.join("\n\n");
                };
                const merged = mergeSubtitlesBySentence(value);
                handleChange(merged);
              }}
              style={{ marginLeft: 8 }}
            >
              合并台词
            </button>
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
          <Viewer
            plugins={[breaks()]}
            value={value.replace(/\r?\n/g, "\n\n")}
          />
        )}
      </div>
    </div>
  );
};

export default EditorView;
