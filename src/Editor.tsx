import { Editor } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { useLocalStorageState, useMount } from "ahooks";

const EditorView = () => {
  const [value, setValue] = useLocalStorageState<string>("editor-content", {
    defaultValue: `# Hello, World!`,
  });

  const [isEditing, setIsEditing] = useLocalStorageState("isEditing", {
    defaultValue: false,
  });

  useMount(() => {
    // 点击预览按钮
    setTimeout(() => {
      const [editEle, previewEle] = document.querySelectorAll(
        ".bytemd-toolbar-tab"
      ) as NodeListOf<HTMLElement>;

      if (!isEditing) {
        previewEle?.click();
      }

      editEle?.addEventListener("click", () => {
        setIsEditing(true);
      });
      previewEle?.addEventListener("click", () => {
        setIsEditing(false);
      });
    }, 200);
  });

  return (
    <Editor
      value={value}
      plugins={[breaks()]}
      onChange={(v: string) => {
        setValue(v);
      }}
    />
  );
};

export default EditorView;
