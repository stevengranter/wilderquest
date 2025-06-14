import { useLocation, useSearchParams } from 'react-router'
import { useSearchContext } from '@/contexts/search/SearchContext'
import { useMemo } from 'react'
import { ToolCall } from 'ai'
import { simplifyResultsForLLM } from '@/components/AiAssistant/helpers'

// --- Tool config map ---
const toolConfig = {
    base: {
        getAppSection: {
            description: 'Get the current app section.',
            parameters: { type: 'object', properties: {} },
        },
    },
    search: {
        getSearchResults: {
            description: 'Get current search results.',
            parameters: { type: 'object', properties: {} },
        },
        getSelectedItems: {
            description: 'Get selected search results.',
            parameters: { type: 'object', properties: {} },
        },
    },
    profile: {
        getUserProfile: {
            description: 'Get user profile data.',
            parameters: { type: 'object', properties: {} },
        },
    },
}

// --- Main Hook ---
export default function useContextualTools() {
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const currentSection = location.pathname.split('/')[1]

    const searchCategory = searchParams.get('category') as 'species' | 'observations'
    const { response: searchResponse, selectedIds } = useSearchContext()

    const simplifiedResults = useMemo(() => {
        return searchResponse?.results
            ? simplifyResultsForLLM(searchResponse.results, searchCategory)
            : null
    }, [searchResponse, searchCategory])

    const selectedSimplifiedResults = useMemo(() => {
        if (!simplifiedResults) return []
        return simplifiedResults.filter(result =>
            selectedIds.includes(Number(result?.id)),
        )
    }, [simplifiedResults, selectedIds])

    const toolDefinitions = useMemo(() => {
        return {
            ...toolConfig.base,
            ...(toolConfig[currentSection] || {}),
        }
    }, [currentSection])

    const handleToolCall = async ({ toolCall }: { toolCall: ToolCall<string, any> }) => {
        const { toolName } = toolCall

        switch (toolName) {
            case 'getAppSection':
                return { section: currentSection }

            case 'getSearchResults':
                return currentSection === 'search'
                    ? { results: simplifiedResults }
                    : notAvailable(toolName)

            case 'getSelectedItems':
                return currentSection === 'search'
                    ? { selected: selectedSimplifiedResults }
                    : notAvailable(toolName)

            case 'getUserProfile':
                return currentSection === 'profile'
                    ? { profile: { name: 'Alice', bio: 'Nature enthusiast' } }
                    : notAvailable(toolName)

            default:
                return notAvailable(toolName)
        }
    }

    return {
        toolDefinitions,
        handleToolCall,
        currentSection,
        contextData: {
            section: currentSection,
            availableTools: Object.keys(toolDefinitions),
        },
    }
}

// --- Helper ---
function notAvailable(toolName: string) {
    return { error: `Tool "${toolName}" is not available in this section.` }
}
