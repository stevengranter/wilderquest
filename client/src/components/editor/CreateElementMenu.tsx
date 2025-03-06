import { DropdownMenu } from "radix-ui";
import React, { ReactNode } from "react";
import {
  Paragraph,
  TextHOne,
  TextHThree,
  TextHTwo,
} from "@phosphor-icons/react";
import EditableComponent from "./EditableComponent";

type ElementType = {
  tag: string;
  label: string;
  icon: React.ReactNode;
};

const elements: ElementType[] = [
  { tag: "p", label: "Paragraph", icon: <Paragraph /> },
  { tag: "h1", label: "Heading 1", icon: <TextHOne /> },
  { tag: "h2", label: "Heading 2", icon: <TextHTwo /> },
  { tag: "h3", label: "Heading 3", icon: <TextHThree /> },
];

export default function CreateElementMenu({
  handleClick,
}: {
  handleClick: (newElement: ReactNode) => void;
}) {
  function createElement(element: ElementType) {
    // const html = `This is an ${element.label}`;
    // console.log(html);
    // return React.createElement(EditableComponent, {
    //   defaultHtml: "This is some html",
    //   defaultTag: element.tag,
    // });

    const newElement = React.createElement(
      element.tag,
      null,
      `This is a new ${element.label}`,
    );
    return newElement;
    // return React.createElement(element.tag, {
    //   html: "Hello World",
    // });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>Add..</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="flex flex-col justify-between bg-primary-100 shadow-lg rounded-sm">
          {elements.map((el, index) => (
            <DropdownMenu.Item
              onClick={() => {
                handleClick(createElement(el));
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
