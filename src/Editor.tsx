import { Editor } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { BytemdPlugin } from "bytemd";
import { useLocalStorageState, useMount } from "ahooks";
import { useRef } from "react";

// 定义 SVG 图标常量
const CLIPBOARD_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>';

// 配置常量
const SELECTION_TIMEOUT_MS = 1000; // 选中文本后等待多少毫秒自动加粗

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

const createSelectionHandler = (timerRef: { current: NodeJS.Timeout | null }) => {
  return (editor: any) => {
    console.log('Selection change triggered');
    
    // 获取编辑器中的选中内容
    const selections = editor.listSelections();
    console.log('Current selections:', selections);
    
    if (!selections || selections.length === 0) {
      console.log('No selection found');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    // 获取第一个选区
    const selection = selections[0];
    const { anchor, head } = selection;
    
    // 确保选区是有效的（不是光标位置）
    if (anchor.line !== head.line || anchor.ch !== head.ch) {
      console.log('Valid selection found:', { anchor, head });
      
      // 清除之前的计时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // 设置新的计时器
      timerRef.current = setTimeout(() => {
        console.log(`Timer triggered after ${SELECTION_TIMEOUT_MS}ms`);
        // 获取当前选区
        const currentSelections = editor.listSelections();
        if (currentSelections && currentSelections.length > 0) {
          const currentSelection = currentSelections[0];
          // 检查选区是否没变
          if (currentSelection.anchor.line === anchor.line && 
              currentSelection.anchor.ch === anchor.ch &&
              currentSelection.head.line === head.line &&
              currentSelection.head.ch === head.ch) {
            // 获取选中的文本
            const selectedText = editor.getRange(
              { line: Math.min(anchor.line, head.line), ch: Math.min(anchor.ch, head.ch) },
              { line: Math.max(anchor.line, head.line), ch: Math.max(anchor.ch, head.ch) }
            );
            console.log('Selected text to bold:', selectedText);
            if (selectedText) {
              const newText = `**${selectedText}**`;
              editor.replaceRange(
                newText,
                { line: Math.min(anchor.line, head.line), ch: Math.min(anchor.ch, head.ch) },
                { line: Math.max(anchor.line, head.line), ch: Math.max(anchor.ch, head.ch) }
              );
            }
          }
        }
      }, SELECTION_TIMEOUT_MS);
    } else {
      console.log('No text selected (cursor only)');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  };
};

const createSelectionPlugin = (timerRef: { current: NodeJS.Timeout | null }): BytemdPlugin => {
  console.log('Selection plugin initialized');
  const handleSelection = createSelectionHandler(timerRef);
  
  return {
    editorEffect: ({ editor }) => {
      console.log('Editor effect setup');
      const boundHandler = () => handleSelection(editor);
      editor.on('cursorActivity', boundHandler);
      
      return () => {
        editor.off('cursorActivity', boundHandler);
      };
    }
  };
};

const EditorView = () => {
  const [value, setValue] = useLocalStorageState<string>("editor-content", {
    defaultValue: `# Hello, World!`,
  });
  const selectionTimer = useRef<NodeJS.Timeout | null>(null);

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

      editEle?.addEventListener("click", handleEditClick);
      previewEle?.addEventListener("click", handlePreviewClick);

      // 返回清理函数
      return () => {
        editEle?.removeEventListener("click", handleEditClick);
        previewEle?.removeEventListener("click", handlePreviewClick);
      };
    }, 200);
  });

  return (
    <Editor
      value={value}
      plugins={[breaks(), clipboardPlugin(), createSelectionPlugin(selectionTimer)]}
      onChange={setValue}
    />
  );
};

export default EditorView;
