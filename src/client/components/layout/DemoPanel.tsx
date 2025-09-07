import React from 'react'
import { DeviceFrameset } from 'react-device-frameset'
import 'react-device-frameset/styles/marvel-devices.min.css'

import FrameSetSSOne from '/screenshot_test.png'

export default function DemoPanel({
    children,
}: {
    children?: React.ReactNode
}) {
    return (
        <DeviceFrameset device="iPhone X" zoom={0.5}>
            {children ? children : <div>Hello world</div>}
        </DeviceFrameset>
    )
}
