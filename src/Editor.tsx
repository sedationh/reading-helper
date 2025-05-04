import { Editor } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { useGetState, useMount } from "ahooks";
import { useEffect, useState } from "react";
import * as LZString from "lz-string";

const EditorView = () => {
  const [value, setValue, getState] = useGetState<string>("");

  const [isEditing, setIsEditing] = useState(true);

  useMount(() => {
    // 自动点击预览按钮
    setTimeout(() => {
      const [editEle, previewEle] = document.querySelectorAll(
        ".bytemd-toolbar-tab"
      ) as NodeListOf<HTMLElement>;

      if (isEditing && getState()) {
        previewEle?.click();
      }

      const handleEditClick = () => setIsEditing(true);
      const handlePreviewClick = () => setIsEditing(false);

      editEle?.addEventListener("click", handleEditClick);
      previewEle?.addEventListener("click", handlePreviewClick);

      // 返回清理函数
      return () => {
        editEle?.removeEventListener("click", handleEditClick);
        previewEle?.removeEventListener("click", handlePreviewClick);
      };
    }, 200);
  });

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
    <Editor
      value={value}
      plugins={[breaks()]}
      onChange={handleChange}
      mode="tab"
    />
  );
};

export default EditorView;
