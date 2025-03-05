import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useRef, useState } from "react";
import * as Selection from "selection-popover";
import classes from "./EditableComponent.module.css";

export default function EditableComponent() {
  const ref = useRef<HTMLElement>(null);
  const [isEditing] = useState(false);
  const [state, setState] = useState({ html: "<b>Hello World</b>" });

  function handleChange(e: ContentEditableEvent) {
    setState({ html: e.target.value });
  }

  return (
    <>
      <Selection.Root>
        <Selection.Trigger>
          <ContentEditable
            innerRef={ref}
            onChange={handleChange}
            html={state.html}
            tagName="p"
            disabled={isEditing}
          />
        </Selection.Trigger>
        <Selection.Portal>
          <Selection.Content className={classes.SelectionContent}>
            <Selection.Arrow />
          </Selection.Content>
        </Selection.Portal>
      </Selection.Root>
    </>
  );
}
