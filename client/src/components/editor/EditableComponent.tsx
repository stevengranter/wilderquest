import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import React, { useEffect, useRef, useState } from "react";
import * as Selection from "selection-popover";
import classes from "./EditableComponent.module.css";
import ElementMenu from "./ElementMenu";
import AlignmentToggleGroup from "./AlignmentToggleGroup";

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
  defaultTag?: string;
  children?: React.ReactNode;
  defaultHtml?: string;
};

export default function EditableComponent({
  defaultTag,
  defaultHtml,
}: EditableComponentProps) {
  const ref = useRef<HTMLElement>(null);
  const [isEditing] = useState(false);
  const [state, setState] = useState({ html: defaultHtml });
  const [tagName, setTagName] = useState<string>(
    defaultTag ? defaultTag.toString() : "div",
  );

  function handleChange(e: ContentEditableEvent) {
    setState({ html: e.target.value });
  }

  useEffect(() => {
    console.log(state);
  }, [state]);

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
            html={defaultHtml}
            tagName={tagName}
            disabled={isEditing}
          />
        </Selection.Trigger>
        <Selection.Portal>
          <Selection.Content
            className={classes.SelectionContent + " " + "flex flex-row"}
          >
            <Selection.Arrow />
            <ElementMenu handleClick={setTagName} />
            <AlignmentToggleGroup />
          </Selection.Content>
        </Selection.Portal>
      </Selection.Root>
    </>
  );
}
