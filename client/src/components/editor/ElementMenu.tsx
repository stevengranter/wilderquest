import { DropdownMenu } from "radix-ui";
import {
  TextHOne,
  TextHTwo,
  TextHThree,
  Paragraph,
} from "@phosphor-icons/react";

const elements = [
  { tag: "p", label: "Paragraph", icon: <Paragraph /> },
  { tag: "h1", label: "Heading 1", icon: <TextHOne /> },
  { tag: "h2", label: "Heading 2", icon: <TextHTwo /> },
  { tag: "h3", label: "Heading 3", icon: <TextHThree /> },
];

export default function ElementMenu({
  handleClick,
}: {
  handleClick: (tag: string) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>Change to</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="flex flex-col justify-between bg-primary-100 shadow-lg rounded-sm">
          {elements.map((el, index) => (
            <DropdownMenu.Item
              onClick={() => {
                handleClick(el.tag);
              }}
              key={index}
              className="flex flex-row align-text-bottom items-center justify-left py-1 "
            >
              <div className="ps-1 pe-2">{el.icon}</div>
              <div className="pe-4">{el.label}</div>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
