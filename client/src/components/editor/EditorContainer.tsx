import { ReactNode, useState } from "react";
import CreateElementMenu from "./CreateElementMenu";

import { ContextMenu } from "radix-ui";
import EditableComponent from "./EditableComponent";

export default function EditorContainer() {
  const [state, setState] = useState<ReactNode[]>([]);

  function addElement(newElement: ReactNode) {
    setState((prevState) => [...prevState, newElement]);
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className="block w-200 h-200">
        Right-click here
        <div>{...state}</div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content>
          <ContextMenu.Label />
          <ContextMenu.Item />
          <CreateElementMenu handleClick={addElement} />
          <ContextMenu.Group>
            <ContextMenu.Item />
          </ContextMenu.Group>

          <ContextMenu.CheckboxItem>
            <ContextMenu.ItemIndicator />
          </ContextMenu.CheckboxItem>

          <ContextMenu.RadioGroup>
            <ContextMenu.RadioItem value="radio-item">
              <ContextMenu.ItemIndicator />
            </ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>

          <ContextMenu.Sub>
            <ContextMenu.SubTrigger />
            <ContextMenu.Portal>
              <ContextMenu.SubContent />
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Separator />
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

// export default function EditorContainer(props: PropsWithChildren) {
//   const locRef = useRef<HTMLDivElement>(null);
//
//   function handleClick(e) {
//     console.log("click event:");
//     console.log(e);
//     console.log(locRef.current);
//     locRef.current.style.color = "blue";
//     locRef.current.style.left = e.clientX + "px";
//     locRef.current.style.top = e.clientY + "px";
//   }
//   const location_indicator = (
//     <div
//       id="location_indicator"
//       className="absolute"
//       style={{ color: "red" }}
//       ref={locRef}
//     >
//       <ElementMenu />
//     </div>
//   );
//   return (
//     <>
//       {location_indicator}
//       <div
//         onClick={(e) => handleClick(e)}
//         className="h-100 w-full bg-slate-200"
//       >
//         {props.children}
//       </div>
//     </>
//   );
// }
