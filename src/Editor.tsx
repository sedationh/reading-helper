import { Editor } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { BytemdPlugin } from "bytemd";
import { useLocalStorageState, useMount } from "ahooks";

// 定义 SVG 图标常量
const CLIPBOARD_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>';

// 自定义插件函数
const clipboardPlugin = (): BytemdPlugin => {
  return {
    actions: [
      {
        title: "粘贴剪贴板内容",
        icon: CLIPBOARD_ICON_SVG,
        handler: {
          type: "action",
          click: async (ctx) => {
            try {
              const text = await navigator.clipboard.readText();
              ctx.editor.setValue(text); // 清空编辑器并设置新内容
            } catch (err) {
              console.error("无法读取剪贴板内容:", err);
            }
          },
        },
      },
    ],
  };
};

const EditorView = () => {
  const [value, setValue] = useLocalStorageState<string>("editor-content", {
    defaultValue: `# Hello, World!`,
  });

  const [isEditing, setIsEditing] = useLocalStorageState("isEditing", {
    defaultValue: false,
  });

  useMount(() => {
    // 自动点击预览按钮
    setTimeout(() => {
      const [editEle, previewEle] = document.querySelectorAll(
        ".bytemd-toolbar-tab"
      ) as NodeListOf<HTMLElement>;

      if (!isEditing) {
        previewEle?.click();
      }

      const handleEditClick = () => setIsEditing(true);
      const handlePreviewClick = () => setIsEditing(false);

      // Add keyboard event listener for Cmd+V or Ctrl+V
      const handleKeyDown = async (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "v") {
          e.preventDefault();
          try {
            const text = await navigator.clipboard.readText();
            setValue(text);
          } catch (err) {
            console.error("无法读取剪贴板内容:", err);
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      editEle?.addEventListener("click", handleEditClick);
      previewEle?.addEventListener("click", handlePreviewClick);

      // 返回清理函数
      return () => {
        editEle?.removeEventListener("click", handleEditClick);
        previewEle?.removeEventListener("click", handlePreviewClick);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, 200);
  });

  return (
    <Editor
      value={value}
      plugins={[breaks(), clipboardPlugin()]}
      onChange={(v: string) => {
        setValue(v);
      }}
    />
  );
};

export default EditorView;
