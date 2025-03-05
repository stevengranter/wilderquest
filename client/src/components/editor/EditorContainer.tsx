import { PropsWithChildren } from "react";

export default function EditorContainer(props: PropsWithChildren) {
  function handleClick() {
    console.log("click");
  }
  return (
    <div onClick={handleClick} className="h-100 w-full bg-slate-200">
      {props.children}
    </div>
  );
}
