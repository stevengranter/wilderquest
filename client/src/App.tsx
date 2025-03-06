import EditableComponent from "./components/editor/EditableComponent";
import EditorContainer from "./components/editor/EditorContainer";
import PageView from "./components/editor/PageView";

const App = () => {
  return (
    <>
      <EditorContainer>
        <EditableComponent />
      </EditorContainer>
      <PageView urlString="/pages/sample.html" />
    </>
  );
};

export default App;
