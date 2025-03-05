import { Meta, StoryObj } from "@storybook/react";
import { Story } from "@storybook/blocks";
import Button from "../../client/src/components/ui/Button";

const meta: Meta = {
  // title: "Components/Button",
  component: Button,
  argTypes: {
    label: { type: "string" },
    variant: {
      control: {
        type: "select",
        options: ["primary", "secondary", "accent", "ghost"],
      },
    },
    size: {
      control: {
        type: "select",
        options: ["small", "medium", "large"],
      },
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    label: "Primary Button",
    variant: "primary",
    size: "medium",
    disabled: false,
  },
};

export const Secondary: Story = {
  args: {
    label: "Secondary Button",
    variant: "secondary",
    size: "medium",
    disabled: false,
  },
};

export const Accent: Story = {
  args: {
    label: "Accent Button",
    variant: "accent",
    size: "medium",
  },
};

export const Ghost: Story = {
  args: {
    label: "Ghost Button",
    variant: "ghost",
    size: "medium",
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Button",
    variant: "primary",
    size: "medium",
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    label: "Small Button",
    variant: "primary",
    size: "small",
    disabled: false,
  },
};

export const Medium: Story = {
  args: {
    label: "Medium Button",
    variant: "primary",
    size: "medium",
    disabled: false,
  },
};

export const Large: Story = {
  args: {
    label: "Large Button",
    variant: "primary",
    size: "large",
    disabled: false,
  },
};
