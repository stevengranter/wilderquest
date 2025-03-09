import { createReactInlineContentSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";

export const MotionGif = createReactInlineContentSpec(
  {
    type: "motionGif",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      url: {
        default: "unknown",
      },
    },
    id: {
      default: "default",
    },
    content: "none",
  },
  {
    render: (props) => (
      <img src={props.inlineContent.props.url} alt="motion gif here" />
    ),
  },
);
