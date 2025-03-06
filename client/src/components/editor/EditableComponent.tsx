import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useEffect, useRef, useState } from "react";
import * as Selection from "selection-popover";
import classes from "./EditableComponent.module.css";
import ElementMenu from "./ElementMenu";

type TextElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "div"
  | "p"
  | "blockquote"
  | "span";

type EditableComponentProps = {
  tag?: TextElement;
};

export default function EditableComponent({
  tag = "div",
}: EditableComponentProps) {
  const ref = useRef<HTMLElement>(null);
  const [isEditing] = useState(false);
  const [state, setState] = useState({ html: "<b>Hello World</b>" });
  const [tagName, setTagName] = useState<string>(tag);

  function handleChange(e: ContentEditableEvent) {
    setState({ html: e.target.value });
  }

  useEffect(() => {
    console.log(tagName);
  }, [tagName]);

  return (
    <>
      <Selection.Root>
        <Selection.Trigger>
          <ContentEditable
            innerRef={ref}
            onChange={handleChange}
            html={state.html}
            tagName={tagName}
            disabled={isEditing}
          />
        </Selection.Trigger>
        <Selection.Portal>
          <Selection.Content className={classes.SelectionContent}>
            <Selection.Arrow />
            <ElementMenu handleClick={setTagName} />
          </Selection.Content>
        </Selection.Portal>
      </Selection.Root>
    </>
  );
}
