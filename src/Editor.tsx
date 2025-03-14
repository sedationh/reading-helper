import { Editor } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { BytemdPlugin } from "bytemd";
import { useLocalStorageState, useMount } from "ahooks";
import { useRef, useState } from "react";
import { notification, Modal, Button, List } from "antd";

// 定义 SVG 图标常量
const CLIPBOARD_PASTE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>';

const CLIPBOARD_COPY_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" /></svg>';

// 配置常量
const SELECTION_TIMEOUT_MS = 1000; // 选中文本后等待多少毫秒自动加粗

// 剪贴板插件
const clipboardPlugin = (): BytemdPlugin => {
  return {
    actions: [
      {
        title: "粘贴剪贴板内容",
        icon: CLIPBOARD_PASTE_ICON_SVG,
        handler: {
          type: "action",
          click: async (ctx) => {
            try {
              const text = await navigator.clipboard.readText();
              ctx.editor.setValue(text);
              notification.success({
                message: "粘贴成功",
                description: "内容已成功粘贴到编辑器",
                placement: "topRight",
              });
            } catch (err) {
              console.error("无法读取剪贴板内容:", err);
              notification.error({
                message: "粘贴失败",
                description: "无法读取剪贴板内容",
                placement: "topRight",
              });
            }
          },
        },
      },
      {
        title: "复制内容到剪贴板",
        icon: CLIPBOARD_COPY_ICON_SVG,
        handler: {
          type: "action",
          click: async (ctx) => {
            try {
              const text = ctx.editor.getValue();
              await navigator.clipboard.writeText(text);
              notification.success({
                message: "复制成功",
                description: "内容已成功复制到剪贴板",
                placement: "topRight",
              });
            } catch (err) {
              console.error("无法写入剪贴板:", err);
              notification.error({
                message: "复制失败",
                description: "无法写入剪贴板",
                placement: "topRight",
              });
            }
          },
        },
      },
    ],
  };
};

const createSelectionHandler = (
  timerRef: { current: NodeJS.Timeout | null },
  disableAutoBoldRef: { current: boolean }
) => {
  return (editor: any) => {
    // 如果禁用了自动加粗，直接返回
    if (disableAutoBoldRef.current) {
      return;
    }

    console.log("Selection change triggered");

    // 获取编辑器中的选中内容
    const selections = editor.listSelections();
    console.log("Current selections:", selections);

    if (!selections || selections.length === 0) {
      console.log("No selection found");
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
      console.log("Valid selection found:", { anchor, head });

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
          if (
            currentSelection.anchor.line === anchor.line &&
            currentSelection.anchor.ch === anchor.ch &&
            currentSelection.head.line === head.line &&
            currentSelection.head.ch === head.ch
          ) {
            // 检查是否是全选
            const totalContent = editor.getValue();
            const selectedText = editor.getRange(
              {
                line: Math.min(anchor.line, head.line),
                ch: Math.min(anchor.ch, head.ch),
              },
              {
                line: Math.max(anchor.line, head.line),
                ch: Math.max(anchor.ch, head.ch),
              }
            );

            // 如果选中的内容等于全部内容，则不执行加粗操作
            if (selectedText === totalContent) {
              console.log("Select all detected, skipping bold formatting");
              return;
            }

            console.log("Selected text to bold:", selectedText);
            if (selectedText) {
              const newText = `**${selectedText}**`;
              editor.replaceRange(
                newText,
                {
                  line: Math.min(anchor.line, head.line),
                  ch: Math.min(anchor.ch, head.ch),
                },
                {
                  line: Math.max(anchor.line, head.line),
                  ch: Math.max(anchor.ch, head.ch),
                }
              );
            }
          }
        }
      }, SELECTION_TIMEOUT_MS);
    } else {
      console.log("No text selected (cursor only)");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  };
};

const createSelectionPlugin = (
  timerRef: { current: NodeJS.Timeout | null },
  disableAutoBoldRef: { current: boolean }
): BytemdPlugin => {
  console.log("Selection plugin initialized");
  const handleSelection = createSelectionHandler(timerRef, disableAutoBoldRef);

  return {
    editorEffect: ({ editor }) => {
      console.log("Editor effect setup");
      const boundHandler = () => handleSelection(editor);
      editor.on("cursorActivity", boundHandler);

      return () => {
        editor.off("cursorActivity", boundHandler);
      };
    },
  };
};

// 添加高亮最后一个strong标签的插件
const highlightLastStrongPlugin = (): BytemdPlugin => {
  return {
    viewerEffect({ markdownBody }) {
      // 创建一个函数来处理高亮
      const highlightLastStrong = () => {
        // 获取所有strong标签
        const strongs = markdownBody.getElementsByTagName("strong");

        // 移除之前的高亮
        Array.from(strongs).forEach((strong) => {
          strong.style.backgroundColor = "";
        });

        // 如果有strong标签，高亮最后一个
        if (strongs.length > 0) {
          const lastStrong = strongs[strongs.length - 1];
          lastStrong.style.backgroundColor = "yellow";
        }
      };

      // 初始高亮
      highlightLastStrong();

      // 创建观察器来监听DOM变化
      const observer = new MutationObserver(highlightLastStrong);

      // 配置观察器
      observer.observe(markdownBody, {
        childList: true,
        subtree: true,
      });

      // 清理函数
      return () => {
        observer.disconnect();
      };
    },
  };
};

const createEditorRefPlugin = (editorRef: React.MutableRefObject<any>): BytemdPlugin => {
  return {
    editorEffect: ({ editor }) => {
      editorRef.current = editor;
      return () => {
        editorRef.current = null;
      };
    },
  };
};

const EditorView = () => {
  const [value, setValue] = useLocalStorageState<string>("editor-content", {
    defaultValue: `# Hello, World!`,
  });
  const selectionTimer = useRef<NodeJS.Timeout | null>(null);
  const [boldCount, setBoldCount] = useState(0);
  const [boldTexts, setBoldTexts] = useState<Array<{ text: string; index: number }>>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const editorRef = useRef<any>(null);
  const disableAutoBold = useRef<boolean>(false);

  const [isEditing, setIsEditing] = useLocalStorageState("isEditing", {
    defaultValue: false,
  });

  // 更新加粗文本计数的函数
  const updateBoldCount = (content: string) => {
    // 使用正则表达式匹配所有加粗文本，并记录位置
    const matches = content.matchAll(/\*\*([^*]+)\*\*/g);
    const boldItems = [];
    let match;
    
    while ((match = matches.next().value)) {
      boldItems.push({
        text: match[1],
        index: match.index
      });
    }
    
    setBoldCount(boldItems.length);
    setBoldTexts(boldItems);
  };

  // 定位到指定文本
  const locateBoldText = (index: number) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const doc = editor.getDoc();
    const pos = doc.posFromIndex(index);
    
    // 将编辑器切换到编辑模式
    const editTab = document.querySelector('.bytemd-toolbar-tab') as HTMLElement;
    if (editTab) {
      editTab.click();
    }

    // 暂时禁用自动加粗
    disableAutoBold.current = true;

    // 设置光标位置并滚动到可见区域
    editor.setCursor(pos);
    editor.focus();
    editor.scrollIntoView({ line: pos.line, ch: pos.ch }, 200);

    // 高亮选中文本
    const text = boldTexts.find(item => item.index === index)?.text;
    if (text) {
      const endPos = {
        line: pos.line,
        ch: pos.ch + text.length + 4 // +4 for the '**' markers
      };
      editor.setSelection(pos, endPos);
    }

    // 1秒后重新启用自动加粗
    setTimeout(() => {
      disableAutoBold.current = false;
    }, 1000);

    // 关闭 Modal
    setIsModalVisible(false);
  };

  useMount(() => {
    // 初始化时计算加粗文本数量
    updateBoldCount(value || "");

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
    <>
      <div
        style={{
          padding: "10px",
          backgroundColor: "#f5f5f5",
          marginBottom: "10px",
          maxHeight: "fit-content",
          flexDirection: "row",
          justifyContent: "end",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span>当前加粗文本数量: {boldCount}</span>
        <Button
          type="primary"
          size="small"
          onClick={() => setIsModalVisible(true)}
          disabled={boldCount === 0}
        >
          查看所有加粗文本
        </Button>
      </div>

      <Modal
        title="所有加粗文本"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={boldTexts}
          renderItem={(item, index) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => locateBoldText(item.index)}
            >
              <List.Item.Meta
                title={
                  <div style={{ color: '#1890ff' }}>
                    {`${index + 1}. ${item.text}`}
                  </div>
                }
              />
            </List.Item>
          )}
          style={{ maxHeight: "400px", overflow: "auto" }}
        />
      </Modal>

      <Editor
        value={value}
        plugins={[
          breaks(),
          clipboardPlugin(),
          createSelectionPlugin(selectionTimer, disableAutoBold),
          highlightLastStrongPlugin(),
          createEditorRefPlugin(editorRef),
        ]}
        onChange={(newValue) => {
          setValue(newValue);
          updateBoldCount(newValue);
        }}
      />
    </>
  );
};

export default EditorView;
