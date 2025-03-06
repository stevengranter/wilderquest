import { ToggleGroup } from "radix-ui";
import {
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
} from "@phosphor-icons/react";

const AlignmentToggleGroup = () => (
  <ToggleGroup.Root
    className="ToggleGroup"
    type="single"
    defaultValue="center"
    aria-label="Text alignment"
  >
    <ToggleGroup.Item
      className="ToggleGroupItem"
      value="left"
      aria-label="Left aligned"
    >
      <TextAlignLeft />
    </ToggleGroup.Item>
    <ToggleGroup.Item
      className="ToggleGroupItem"
      value="center"
      aria-label="Center aligned"
    >
      <TextAlignCenter />
    </ToggleGroup.Item>
    <ToggleGroup.Item
      className="ToggleGroupItem"
      value="right"
      aria-label="Right aligned"
    >
      <TextAlignRight />
    </ToggleGroup.Item>
  </ToggleGroup.Root>
);

export default AlignmentToggleGroup;
