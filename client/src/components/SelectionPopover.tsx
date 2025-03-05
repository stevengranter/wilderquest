import * as Selection from "selection-popover";

export default function SelectionPopover() {
  return (
    <Selection.Root>
      <Selection.Trigger />
      <Selection.Portal>
        <Selection.Content>
          <Selection.Arrow />
        </Selection.Content>
      </Selection.Portal>
    </Selection.Root>
  );
}
