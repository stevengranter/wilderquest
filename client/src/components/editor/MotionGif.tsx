import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";

export const MotionGif = createReactBlockSpec(
  {
    type: "motionGif",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      url: {
        default: "unknown",
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <img src={props.block.props.url} alt="motion gif here" />
    ),
  },
);
