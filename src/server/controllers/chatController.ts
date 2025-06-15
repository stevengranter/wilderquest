import 'dotenv/config'
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import type { Request, Response, RequestHandler } from 'express'
import { z } from 'zod'

// 1. Define Card Interface (kept outside if it's a shared type)
// interface Card {
//     id: string
//     name?: string
//     type?: string
//     wikipedia_url?: string
// }

// 2. Define FilterState Interface (kept outside if it's a shared type)
// interface FilterState {
//     kingdoms: string[]
//     ranks: string[]
//     hasPhotos: boolean | null
//     dateRange: { start: string; end: string }
//     location: string
// }

// 3. Define ApparatusState Interface for req.body (kept outside if it's a shared type)
// interface ApparatusState {
//     query: string
//     messages: CoreMessage[]
//     currentCards: Card[]
//     filteredCards: Card[]
//     selectedCards: Card[]
//     selectedCount: number
//     filters: FilterState
//     viewMode: 'list' | 'grid' | 'map'
//     searchType: 'taxa' | 'observations' | 'collections'
//     currentLocation: { latitude: number; longitude: number } | null
// }

// 4. Define the ChatController Interface
// This interface will define the methods that our chat controller object will have.
export interface ChatController {
    handleChatRequest: RequestHandler
}

// 5. Define the system prompt (can be part of the factory or internal to the handler)
const systemPrompt = `
You are a helpful assistant for an iNaturalist-like application. Be conversational and friendly.
If the user says hello or asks a simple question, reply normally.
Only call tools when additional context is clearly needed.

You can help users with:
- Searching for taxa, observations, or collections
- Managing their selection of multiple items
- Changing view modes and search types
- Getting detailed information from Wikipedia
- Searching the web for current information, research, and news
- Understanding their current context
- Setting and managing filters to narrow down search results

When working with web search:
- Use web search for current events, recent research, conservation status updates
- Use web search when Wikipedia doesn't have enough information
- Use web search for location-specific information about species
- Always cite your sources when using web search results

When working with filters:
- You can filter taxa by kingdom (Plantae, Animalia, Fungi, etc.) and taxonomic rank
- You can filter observations by date range, location, and presence of photos
- You can clear filters when the user wants to see all results again
- You can suggest relevant filters based on the user's interests

When providing information from a Wikipedia article (obtained via the 'fetchWikipediaArticle' tool using a card's 'wikipedia_url'), you *must* synthesize and present **comprehensive and relevant details** from the fetched content.
Focus on key facts, definitions, characteristics, historical context, and notable aspects.

Use rich text liberally including bold, italic, links, headings, lists, emojis and more.
Return Markdown.
`

// 6. Create the factory function
// This function will return an object that implements the ChatController interface.
// If you had external services (e.g., a specific search API client), you would inject them here.
export function createChatController(): ChatController {
    return {
        // The main request handler for the chat endpoint
        async handleChatRequest(
            req: Request,
            res: Response,
        ) {
            const {
                query,
                messages,
                currentCards,
                filteredCards,
                selectedCards,
                selectedCount,
                filters,
                viewMode,
                searchType,
                currentLocation,
            } = req.body

            try {
                const result = streamText({
                    model: google('gemini-2.5-flash-preview-04-17'),
                    system: systemPrompt,
                    messages,
                    maxSteps: 5,
                    tools: {
                        getAppContext: {
                            description:
                                'Get the current state of the user interface including displayed cards, selected cards, search type, filters, and current location.',
                            parameters: z.object({}),
                            execute: async () => {
                                return {
                                    success: true,
                                    data: {
                                        query: query || '',
                                        currentCards: currentCards || [],
                                        filteredCards: filteredCards || [],
                                        selectedCards: selectedCards || [],
                                        selectedCount: selectedCount || 0,
                                        totalCards: currentCards?.length ?? 0,
                                        filters: filters || {
                                            kingdoms: [],
                                            ranks: [],
                                            hasPhotos: null,
                                            dateRange: { start: '', end: '' },
                                            location: '',
                                        },
                                        viewMode: viewMode,
                                        searchType: searchType,
                                        currentLocation: currentLocation || null,
                                    },
                                }
                            },
                        },

                        searchWeb: {
                            description:
                                'Search the web for current information, research, news, or any topic not covered by other tools',
                            parameters: z.object({
                                query: z.string().describe('The search query to look up on the web'),
                                maxResults: z.number().optional().default(5).describe('Maximum number of results to return (1-10)'),
                            }),
                            execute: async ({ query, maxResults = 5 }) => {
                                try {
                                    console.log(`AI requested web search for: "${query}"`)

                                    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`

                                    const response = await fetch(searchUrl)
                                    if (!response.ok) {
                                        throw new Error(`HTTP error! status: ${response.status}`)
                                    }

                                    const data: {
                                        Abstract?: string
                                        Heading?: string
                                        AbstractURL?: string
                                        AbstractSource?: string
                                        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>
                                        Definition?: string
                                        DefinitionURL?: string
                                        DefinitionSource?: string
                                    } = await response.json()

                                    const results: {
                                        title: string
                                        snippet: string
                                        url: string
                                        source: string
                                    }[] = []

                                    if (data.Abstract) {
                                        results.push({
                                            title: data.Heading || 'Summary',
                                            snippet: data.Abstract,
                                            url: data.AbstractURL || '',
                                            source: data.AbstractSource || 'DuckDuckGo',
                                        })
                                    }

                                    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                                        data.RelatedTopics.slice(0, maxResults - 1).forEach((topic) => {
                                            if (topic.Text && topic.FirstURL) {
                                                results.push({
                                                    title: topic.Text.split(' - ')[0] || 'Related Topic',
                                                    snippet: topic.Text,
                                                    url: topic.FirstURL,
                                                    source: 'DuckDuckGo',
                                                })
                                            }
                                        })
                                    }

                                    if (data.Definition) {
                                        results.push({
                                            title: 'Definition',
                                            snippet: data.Definition,
                                            url: data.DefinitionURL || '',
                                            source: data.DefinitionSource || 'DuckDuckGo',
                                        })
                                    }

                                    return {
                                        success: true,
                                        data: {
                                            query,
                                            results: results.slice(0, maxResults),
                                            totalResults: results.length,
                                        },
                                        message: `Found ${results.length} web search results for "${query}".`,
                                    }
                                } catch (error) {
                                    console.error('Error performing web search:', error)
                                    return {
                                        success: false,
                                        error: 'Failed to perform web search.',
                                        message: 'Web search is currently unavailable. Please try again later.',
                                    }
                                }
                            },
                        },

                        searchNews: {
                            description: 'Search for recent news articles about a specific topic',
                            parameters: z.object({
                                query: z.string().describe('The news search query'),
                                maxResults: z.number().optional().default(3).describe('Maximum number of news results to return'),
                            }),
                            execute: async ({ query, maxResults = 3 }) => {
                                try {
                                    console.log(`AI requested news search for: "${query}"`)

                                    const newsQuery = `${query} news recent`
                                    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(newsQuery)}&format=json&no_html=1&skip_disambig=1`

                                    const response = await fetch(searchUrl)
                                    if (!response.ok) {
                                        throw new Error(`HTTP error! status: ${response.status}`)
                                    }

                                    const data: {
                                        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>
                                    } = await response.json()

                                    const newsResults: {
                                        title: string
                                        snippet: string
                                        url: string
                                        source: string
                                        publishedAt: string
                                    }[] = []

                                    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                                        data.RelatedTopics.slice(0, maxResults).forEach((topic) => {
                                            if (topic.Text && topic.FirstURL) {
                                                newsResults.push({
                                                    title: topic.Text.split(' - ')[0] || 'News Article',
                                                    snippet: topic.Text,
                                                    url: topic.FirstURL,
                                                    source: 'News Search',
                                                    publishedAt: new Date().toISOString(),
                                                })
                                            }
                                        })
                                    }

                                    return {
                                        success: true,
                                        data: {
                                            query,
                                            results: newsResults,
                                            totalResults: newsResults.length,
                                        },
                                        message: `Found ${newsResults.length} recent news results for "${query}".`,
                                    }
                                } catch (error) {
                                    console.error('Error performing news search:', error)
                                    return {
                                        success: false,
                                        error: 'Failed to perform news search.',
                                        message: 'News search is currently unavailable. Please try again later.',
                                    }
                                }
                            },
                        },

                        searchScientificPapers: {
                            description: 'Search for scientific papers and research about a specific topic',
                            parameters: z.object({
                                query: z.string().describe('The scientific research query'),
                                maxResults: z.number().optional().default(3).describe('Maximum number of paper results to return'),
                            }),
                            execute: async ({ query, maxResults = 3 }) => {
                                try {
                                    console.log(`AI requested scientific paper search for: "${query}"`)

                                    const searchUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${maxResults}&sort=relevance&order=desc`

                                    const response = await fetch(searchUrl, {
                                        headers: {
                                            'User-Agent': 'iNaturalist-AI-Assistant/1.0 (mailto:your-email@example.com)',
                                        },
                                    })

                                    if (!response.ok) {
                                        throw new Error(`HTTP error! status: ${response.status}`)
                                    }

                                    const data: {
                                        message?: {
                                            items?: Array<{
                                                title?: string[]
                                                author?: Array<{ given?: string; family?: string }>
                                                'container-title'?: string[]
                                                published?: { 'date-parts': number[][] }
                                                DOI?: string
                                                URL?: string
                                                abstract?: string
                                            }>
                                        }
                                    } = await response.json()

                                    const papers: {
                                        title: string
                                        authors: string
                                        journal: string
                                        publishedDate: string
                                        doi: string
                                        url: string
                                        abstract: string
                                    }[] = []

                                    if (data.message && data.message.items) {
                                        data.message.items.forEach((item) => {
                                            papers.push({
                                                title: item.title ? item.title[0] : 'Untitled Paper',
                                                authors: item.author
                                                    ? item.author.map((a) => `${a.given || ''} ${a.family || ''}`).join(', ')
                                                    : 'Unknown Authors',
                                                journal: item['container-title'] ? item['container-title'][0] : 'Unknown Journal',
                                                publishedDate: item.published ? `${item.published['date-parts'][0][0]}` : 'Unknown Date',
                                                doi: item.DOI || 'N/A',
                                                url: item.URL || `https://doi.org/${item.DOI}`,
                                                abstract: item.abstract || 'No abstract available',
                                            })
                                        })
                                    }

                                    return {
                                        success: true,
                                        data: {
                                            query,
                                            results: papers,
                                            totalResults: papers.length,
                                        },
                                        message: `Found ${papers.length} scientific papers for "${query}".`,
                                    }
                                } catch (error) {
                                    console.error('Error searching scientific papers:', error)
                                    return {
                                        success: false,
                                        error: 'Failed to search scientific papers.',
                                        message: 'Scientific paper search is currently unavailable. Please try again later.',
                                    }
                                }
                            },
                        },

                        setFilters: {
                            description: 'Set filters to narrow down search results',
                            parameters: z.object({
                                filters: z.object({
                                    kingdoms: z
                                        .array(z.string())
                                        .optional()
                                        .describe('Array of kingdoms to filter by (e.g., Plantae, Animalia, Fungi)'),
                                    ranks: z
                                        .array(z.string())
                                        .optional()
                                        .describe('Array of taxonomic ranks to filter by (e.g., species, genus, family, etc.)'),
                                    hasPhotos: z
                                        .boolean()
                                        .nullable()
                                        .optional()
                                        .describe('Filter by presence of photos (true, false, or null for no filter)'),
                                    dateRange: z
                                        .object({
                                            start: z.string().optional().describe('Start date inYYYY-MM-DD format'),
                                            end: z.string().optional().describe('End date inYYYY-MM-DD format'),
                                        })
                                        .optional(),
                                    location: z.string().optional().describe('Location text to filter by'),
                                }),
                            }),
                            execute: async ({ filters }) => {
                                console.log('AI has requested to set filters:', filters)
                                return {
                                    success: true,
                                    data: { filters },
                                    message: `Filters updated successfully.`,
                                }
                            },
                        },

                        clearFilters: {
                            description: 'Clear all active filters',
                            parameters: z.object({}),
                            execute: async () => {
                                console.log('AI has requested to clear all filters')
                                return {
                                    success: true,
                                    data: { clearedFilters: true },
                                    message: 'All filters cleared.',
                                }
                            },
                        },

                        suggestFilters: {
                            description: 'Suggest relevant filters based on current results',
                            parameters: z.object({
                                interest: z.string().describe('User\'s expressed interest (e.g., \'plants\', \'endangered species\')'),
                            }),
                            execute: async ({ interest }) => {
                                console.log('AI has requested filter suggestions for:', interest)

                                const suggestions = {
                                    interest,
                                    suggestedFilters: {
                                        kingdoms: interest.toLowerCase().includes('plant')
                                            ? ['Plantae']
                                            : interest.toLowerCase().includes('animal')
                                                ? ['Animalia']
                                                : interest.toLowerCase().includes('fungi')
                                                    ? ['Fungi']
                                                    : [],
                                        ranks: interest.toLowerCase().includes('species') ? ['species'] : [],
                                    },
                                }

                                return {
                                    success: true,
                                    data: suggestions,
                                    message: `Suggested filters for "${interest}".`,
                                }
                            },
                        },

                        setSearchText: {
                            description: 'Set the search text in the user interface',
                            parameters: z.object({
                                searchText: z
                                    .string()
                                    .describe('A valid common or scientific name for a species, genus, family, or class.'),
                            }),
                            execute: async ({ searchText }) => {
                                return {
                                    success: true,
                                    data: searchText,
                                }
                            },
                        },

                        submitSearch: {
                            description: 'Set and submit the search text in the user interface',
                            parameters: z.object({
                                searchText: z
                                    .string()
                                    .describe('A valid common or scientific name for a species, genus, family, or class.'),
                            }),
                            execute: async ({ searchText }) => {
                                return {
                                    success: true,
                                    data: searchText,
                                }
                            },
                        },

                        selectCards: {
                            description: 'Select specific cards by their IDs, replacing any current selection',
                            parameters: z.object({
                                cardIds: z.array(z.string()).describe('Array of card IDs to select'),
                            }),
                            execute: async ({ cardIds }) => {
                                console.log(`AI has requested to select cards: ${cardIds.join(', ')}`)
                                return {
                                    success: true,
                                    data: { selectedIds: cardIds },
                                    message: `Selected ${cardIds.length} cards.`,
                                }
                            },
                        },

                        addToSelection: {
                            description: 'Add specific cards to the current selection',
                            parameters: z.object({
                                cardIds: z.array(z.string()).describe('Array of card IDs to add to selection'),
                            }),
                            execute: async ({ cardIds }) => {
                                console.log(`AI has requested to add cards to selection: ${cardIds.join(', ')}`)
                                return {
                                    success: true,
                                    data: { selectedIds: cardIds },
                                    message: `Added ${cardIds.length} cards to selection.`,
                                }
                            },
                        },

                        removeFromSelection: {
                            description: 'Remove specific cards from the current selection',
                            parameters: z.object({
                                cardIds: z.array(z.string()).describe('Array of card IDs to remove from selection'),
                            }),
                            execute: async ({ cardIds }) => {
                                console.log(`AI has requested to remove cards from selection: ${cardIds.join(', ')}`)
                                return {
                                    success: true,
                                    data: { selectedIds: cardIds },
                                    message: `Removed ${cardIds.length} cards from selection.',`,
                                }
                            },
                        },

                        clearSelection: {
                            description: 'Clear all selected cards',
                            parameters: z.object({}),
                            execute: async () => {
                                console.log('AI has requested to clear all selections')
                                return {
                                    success: true,
                                    data: { selectedIds: [] },
                                    message: 'Cleared all selections.',
                                }
                            },
                        },

                        selectByType: {
                            description:
                                'Select cards based on specific criteria (e.g., all taxa of a certain rank, observations from a date range)',
                            parameters: z.object({
                                criteria: z.object({
                                    rank: z.string().optional().describe('For taxa: select by taxonomic rank (species, genus, family, etc.)'),
                                    dateRange: z
                                        .object({
                                            start: z.string().optional(),
                                            end: z.string().optional(),
                                        })
                                        .optional()
                                        .describe('For observations: select by date range'),
                                    location: z.string().optional().describe('Select by location/place'),
                                    hasPhotos: z.boolean().optional().describe('For observations: select only those with photos'),
                                }),
                            }),
                            execute: async ({ criteria }) => {
                                console.log('AI has requested to select by criteria:', criteria)
                                return {
                                    success: true,
                                    data: { criteria },
                                    message: `Selection criteria applied: ${JSON.stringify(criteria)}`,
                                }
                            },
                        },

                        fetchWikipediaArticle: {
                            description: 'Fetch a Wikipedia article by title',
                            parameters: z.object({
                                title: z.string().describe('The title of the Wikipedia article to fetch.'),
                            }),
                            execute: async ({ title }) => {
                                try {
                                    const response = await fetch(
                                        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
                                    )
                                    if (!response.ok) {
                                        throw new Error(`HTTP error! status: ${response.status}`)
                                    }
                                    // ... rest of your fetchWikipediaArticle logic
                                    const data = await response.json()
                                    return { success: true, data: data }
                                } catch (error) {
                                    console.error('Error fetching Wikipedia article:', error)
                                    return {
                                        success: false,
                                        error: 'Failed to fetch Wikipedia article.',
                                        message: 'Wikipedia article lookup failed.',
                                    }
                                }
                            },
                        },
                    },
                })
                // ... rest of your handleChatRequest logic
                res.setHeader('Content-Type', 'text/plain')
                for await (const chunk of result.fullStream) {
                    res.write(chunk.toString())
                }
                res.end()
            } catch (error) {
                console.error('Error handling chat request:', error)
                res.status(500).json({ error: 'Internal server error' })
            }
        },
    }
}
