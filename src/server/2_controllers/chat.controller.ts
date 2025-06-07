import 'dotenv/config'
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import type { RequestHandler } from 'express'
import { z } from 'zod'

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

const chatController: RequestHandler = async (req, res) => {
    // Destructure the new multi-selection state and filters from req.body
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
            // model: lmstudio("llama3.2/llama3.2-latest"),
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

                // Web search tools
                searchWeb: {
                    description:
                        'Search the web for current information, research, news, or any topic not covered by other tools',
                    parameters: z.object({
                        query: z
                            .string()
                            .describe('The search query to look up on the web'),
                        maxResults: z
                            .number()
                            .optional()
                            .default(5)
                            .describe('Maximum number of results to return (1-10)'),
                    }),
                    execute: async ({ query, maxResults = 5 }) => {
                        try {
                            console.log(`AI requested web search for: "${query}"`)

                            // Using DuckDuckGo Instant Answer API (free, no API key required)
                            const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`

                            const response = await fetch(searchUrl)
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`)
                            }

                            const data = await response.json()

                            // Extract useful information from DuckDuckGo response
                            const results = []

                            // Add abstract if available
                            if (data.Abstract) {
                                results.push({
                                    title: data.Heading || 'Summary',
                                    snippet: data.Abstract,
                                    url: data.AbstractURL,
                                    source: data.AbstractSource || 'DuckDuckGo',
                                })
                            }

                            // Add related topics
                            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                                data.RelatedTopics.slice(0, maxResults - 1).forEach(
                                    (topic: any) => {
                                        if (topic.Text && topic.FirstURL) {
                                            results.push({
                                                title: topic.Text.split(' - ')[0] || 'Related Topic',
                                                snippet: topic.Text,
                                                url: topic.FirstURL,
                                                source: 'DuckDuckGo',
                                            })
                                        }
                                    },
                                )
                            }

                            // Add definition if available
                            if (data.Definition) {
                                results.push({
                                    title: 'Definition',
                                    snippet: data.Definition,
                                    url: data.DefinitionURL,
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
                                message:
                                    'Web search is currently unavailable. Please try again later.',
                            }
                        }
                    },
                },

                searchNews: {
                    description: 'Search for recent news articles about a specific topic',
                    parameters: z.object({
                        query: z.string().describe('The news search query'),
                        maxResults: z
                            .number()
                            .optional()
                            .default(3)
                            .describe('Maximum number of news results to return'),
                    }),
                    execute: async ({ query, maxResults = 3 }) => {
                        try {
                            console.log(`AI requested news search for: "${query}"`)

                            // Using a simple RSS feed approach for news (you can replace with a proper news API)
                            // For now, we'll use DuckDuckGo with news-specific query
                            const newsQuery = `${query} news recent`
                            const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(newsQuery)}&format=json&no_html=1&skip_disambig=1`

                            const response = await fetch(searchUrl)
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`)
                            }

                            const data = await response.json()

                            const newsResults = []

                            // Extract news-related information
                            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                                data.RelatedTopics.slice(0, maxResults).forEach(
                                    (topic: any) => {
                                        if (topic.Text && topic.FirstURL) {
                                            newsResults.push({
                                                title: topic.Text.split(' - ')[0] || 'News Article',
                                                snippet: topic.Text,
                                                url: topic.FirstURL,
                                                source: 'News Search',
                                                publishedAt: new Date().toISOString(), // Placeholder - real news API would have actual dates
                                            })
                                        }
                                    },
                                )
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
                                message:
                                    'News search is currently unavailable. Please try again later.',
                            }
                        }
                    },
                },

                searchScientificPapers: {
                    description:
                        'Search for scientific papers and research about a specific topic',
                    parameters: z.object({
                        query: z.string().describe('The scientific research query'),
                        maxResults: z
                            .number()
                            .optional()
                            .default(3)
                            .describe('Maximum number of paper results to return'),
                    }),
                    execute: async ({ query, maxResults = 3 }) => {
                        try {
                            console.log(
                                `AI requested scientific paper search for: "${query}"`,
                            )

                            // Using CrossRef API for scientific papers (free, no API key required)
                            const searchUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${maxResults}&sort=relevance&order=desc`

                            const response = await fetch(searchUrl, {
                                headers: {
                                    'User-Agent':
                                        'iNaturalist-AI-Assistant/1.0 (mailto:your-email@example.com)', // Required by CrossRef
                                },
                            })

                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`)
                            }

                            const data = await response.json()

                            const papers = []

                            if (data.message && data.message.items) {
                                data.message.items.forEach((item: any) => {
                                    papers.push({
                                        title: item.title ? item.title[0] : 'Untitled Paper',
                                        authors: item.author
                                            ? item.author
                                                .map((a: any) => `${a.given || ''} ${a.family || ''}`)
                                                .join(', ')
                                            : 'Unknown Authors',
                                        journal: item['container-title']
                                            ? item['container-title'][0]
                                            : 'Unknown Journal',
                                        publishedDate: item.published
                                            ? `${item.published['date-parts'][0][0]}`
                                            : 'Unknown Date',
                                        doi: item.DOI,
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
                                message:
                                    'Scientific paper search is currently unavailable. Please try again later.',
                            }
                        }
                    },
                },

                // New filter-related tools
                setFilters: {
                    description: 'Set filters to narrow down search results',
                    parameters: z.object({
                        filters: z.object({
                            kingdoms: z
                                .array(z.string())
                                .optional()
                                .describe(
                                    'Array of kingdoms to filter by (e.g., Plantae, Animalia, Fungi)',
                                ),
                            ranks: z
                                .array(z.string())
                                .optional()
                                .describe(
                                    'Array of taxonomic ranks to filter by (e.g., species, genus, family)',
                                ),
                            hasPhotos: z
                                .boolean()
                                .nullable()
                                .optional()
                                .describe(
                                    'Filter by presence of photos (true, false, or null for no filter)',
                                ),
                            dateRange: z
                                .object({
                                    start: z
                                        .string()
                                        .optional()
                                        .describe('Start date in YYYY-MM-DD format'),
                                    end: z
                                        .string()
                                        .optional()
                                        .describe('End date in YYYY-MM-DD format'),
                                })
                                .optional(),
                            location: z
                                .string()
                                .optional()
                                .describe('Location text to filter by'),
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
                        interest: z
                            .string()
                            .describe(
                                'User\'s expressed interest (e.g., \'plants\', \'endangered species\')',
                            ),
                    }),
                    execute: async ({ interest }) => {
                        console.log('AI has requested filter suggestions for:', interest)

                        // In a real implementation, you would analyze currentCards to find relevant filters
                        // For now, return placeholder suggestions
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
                                ranks: interest.toLowerCase().includes('species')
                                    ? ['species']
                                    : [],
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
                            .describe(
                                'A valid common or scientific name for a species, genus, family, or class.',
                            ),
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
                            .describe(
                                'A valid common or scientific name for a species, genus, family, or class.',
                            ),
                    }),
                    execute: async ({ searchText }) => {
                        return {
                            success: true,
                            data: searchText,
                        }
                    },
                },

                // New selection management tools
                selectCards: {
                    description:
                        'Select specific cards by their IDs, replacing any current selection',
                    parameters: z.object({
                        cardIds: z
                            .array(z.string())
                            .describe('Array of card IDs to select'),
                    }),
                    execute: async ({ cardIds }) => {
                        console.log(
                            `AI has requested to select cards: ${cardIds.join(', ')}`,
                        )
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
                        cardIds: z
                            .array(z.string())
                            .describe('Array of card IDs to add to selection'),
                    }),
                    execute: async ({ cardIds }) => {
                        console.log(
                            `AI has requested to add cards to selection: ${cardIds.join(', ')}`,
                        )
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
                        cardIds: z
                            .array(z.string())
                            .describe('Array of card IDs to remove from selection'),
                    }),
                    execute: async ({ cardIds }) => {
                        console.log(
                            `AI has requested to remove cards from selection: ${cardIds.join(', ')}`,
                        )
                        return {
                            success: true,
                            data: { selectedIds: cardIds },
                            message: `Removed ${cardIds.length} cards from selection.`,
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
                            rank: z
                                .string()
                                .optional()
                                .describe(
                                    'For taxa: select by taxonomic rank (species, genus, family, etc.)',
                                ),
                            dateRange: z
                                .object({
                                    start: z.string().optional(),
                                    end: z.string().optional(),
                                })
                                .optional()
                                .describe('For observations: select by date range'),
                            location: z
                                .string()
                                .optional()
                                .describe('Select by location/place'),
                            hasPhotos: z
                                .boolean()
                                .optional()
                                .describe('For observations: select only those with photos'),
                        }),
                    }),
                    execute: async ({ criteria }) => {
                        console.log('AI has requested to select by criteria:', criteria)
                        // In a real implementation, you would filter currentCards based on criteria
                        // For now, return a placeholder response
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
                        title: z
                            .string()
                            .describe('The title of the Wikipedia article to fetch.'),
                    }),
                    execute: async ({ title }) => {
                        try {
                            const response = await fetch(
                                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
                            )
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`)
                            }
                            const data = await response.json()
                            return { success: true, data: data.extract } // Returns a summary of the article
                        } catch (error) {
                            console.error('Error fetching Wikipedia article:', error)
                            return {
                                success: false,
                                error: 'Failed to fetch Wikipedia article.',
                            }
                        }
                    },
                },

                setViewMode: {
                    description:
                        'Sets the display mode for search results (list, grid, or map).',
                    parameters: z.object({
                        mode: z
                            .enum(['list', 'grid', 'map'])
                            .describe('The desired view mode for the search results.'),
                    }),
                    execute: async ({ mode }) => {
                        console.log(`AI has requested to set view mode to: ${mode}`)
                        return {
                            success: true,
                            data: { newViewMode: mode },
                            message: `View mode set to ${mode}.`,
                        }
                    },
                },

                setSearchType: {
                    description:
                        'Sets the type of search to perform (taxa, observations, or collections/projects).',
                    parameters: z.object({
                        type: z
                            .enum(['taxa', 'observations', 'collections'])
                            .describe('The desired search type.'),
                    }),
                    execute: async ({ type }) => {
                        console.log(`AI has requested to set search type to: ${type}`)
                        return {
                            success: true,
                            data: { newSearchType: type },
                            message: `Search type set to ${type}.`,
                        }
                    },
                },

                // Enhanced analysis tools for multiple selections
                analyzeSelection: {
                    description:
                        'Analyze the currently selected cards to provide insights, patterns, or summaries',
                    parameters: z.object({
                        analysisType: z
                            .enum(['summary', 'comparison', 'patterns', 'geographic'])
                            .describe('Type of analysis to perform'),
                    }),
                    execute: async ({ analysisType }) => {
                        console.log(
                            `AI has requested to analyze selection with type: ${analysisType}`,
                        )

                        // In a real implementation, you would analyze the selectedCards based on analysisType
                        const analysisResults = {
                            summary: `Analysis of ${selectedCount || 0} selected items`,
                            selectedCards: selectedCards || [],
                            analysisType,
                        }

                        return {
                            success: true,
                            data: analysisResults,
                            message: `Performed ${analysisType} analysis on ${selectedCount || 0} selected items.`,
                        }
                    },
                },

                getUserLocationTool: {
                    description:
                        'Request the user\'s current location for location-based searches and filtering',
                    parameters: z.object({}),
                    execute: async () => {
                        console.log('AI has requested user location')
                        // This will be handled by the frontend
                        return {
                            success: true,
                            data: { requestLocation: true },
                            message: 'Requesting user location...',
                        }
                    },
                },

                // Optional: Export functionality
                exportSelection: {
                    description: 'Export the selected cards in a specified format',
                    parameters: z.object({
                        format: z.enum(['csv', 'json', 'txt']).describe('Export format'),
                        includeImages: z
                            .boolean()
                            .optional()
                            .describe('Whether to include image URLs in export'),
                    }),
                    execute: async ({ format, includeImages = false }) => {
                        console.log(
                            `AI has requested to export selection in ${format} format`,
                        )
                        return {
                            success: true,
                            data: {
                                format,
                                includeImages,
                                selectedCount: selectedCount || 0,
                            },
                            message: `Prepared export of ${selectedCount || 0} selected items in ${format} format.`,
                        }
                    },
                },
            },
        })

        result.pipeDataStreamToResponse(res)
    } catch (error) {
        console.error('Streaming error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

export default chatController
