import {createReactInlineContentSpec} from '@blocknote/react'
import {defaultProps} from '@blocknote/core'
import {motion} from 'motion/react'

export const MotionGif = createReactInlineContentSpec(
    {
        type: 'motionGif',
        propSchema: {
            textAlignment: defaultProps.textAlignment,
            textColor: defaultProps.textColor,
            url: {
                default: 'unknown',
            },
        },
        id: {
            default: 'default',
        },
        content: 'none',
    },
    {
        render: (props) => (
            <motion.img
                initial={{scale: 0}}
                animate={{scale: 1}}
                src={props.inlineContent.props.url}
                alt='motion gif here'
            />
        ),
    }
)
