import { Editor } from "@bytemd/react";
import breaks from "@bytemd/plugin-breaks";
import { useLocalStorageState } from "ahooks";

const EditorView = () => {
  const [value, setValue] = useLocalStorageState<string>("editor-content", {
    defaultValue: `# Hello, World!`,
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
