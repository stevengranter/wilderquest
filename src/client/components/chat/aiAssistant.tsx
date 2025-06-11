import { useLocation } from 'react-router'

export default function AiAssistant() {
    const location = useLocation()
    console.log({ location })
    const pathname = location.pathname
    console.log({ pathname })

    return <div>AI Assistant</div>
}
