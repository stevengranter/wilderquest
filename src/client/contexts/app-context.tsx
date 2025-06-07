'use client'

import type React from 'react'
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useReducer,
} from 'react'

// Define the filter state type
export type FilterState = {
	kingdoms: Set<string>;
	ranks: Set<string>;
	hasPhotos: boolean | null;
	dateRange: {
		start: string;
		end: string;
	};
	location: string;
};

// Helper function to safely convert to a Set
function ensureSet(value: any): Set<string> {
	if (value instanceof Set) return value
	if (Array.isArray(value)) return new Set(value)
	if (value == null) return new Set()
	// If it's a function or other non-iterable, return empty Set
	try {
		return new Set(Object.values(value))
	} catch (e) {
		console.warn('Could not convert value to Set:', value)
		return new Set()
	}
}

// Define the main app state
type AppState = {
	query: string;
	results: any[];
	filteredResults: any[];
	viewMode: 'grid' | 'list' | 'map';
	searchType: 'species' | 'observations' | 'collections';
	selectedIds: Set<string>;
	location: { lat: number; lng: number } | null;
	filters: FilterState;
};

// Define action types
type AppAction =
	| { type: 'SET_QUERY'; payload: string }
	| { type: 'SET_RESULTS'; payload: any[] }
	| { type: 'SET_FILTERED_RESULTS'; payload: any[] }
	| { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' | 'map' }
	| {
	type: 'SET_SEARCH_TYPE';
	payload: 'species' | 'observations' | 'collections';
}
	| { type: 'SET_SELECTED_IDS'; payload: Set<string> | string[] }
	| { type: 'ADD_TO_SELECTION'; payload: string[] }
	| { type: 'REMOVE_FROM_SELECTION'; payload: string[] }
	| { type: 'CLEAR_SELECTION' }
	| { type: 'SET_LOCATION'; payload: { lat: number; lng: number } | null }
	| { type: 'SET_FILTERS'; payload: FilterState }
	| { type: 'UPDATE_FILTER'; payload: { key: keyof FilterState; value: any } }
	| { type: 'CLEAR_FILTERS' }
	| { type: 'RESET_SEARCH_STATE' };

// Initial state
const initialState: AppState = {
	query: '',
	results: [],
	filteredResults: [],
	viewMode: 'grid',
	searchType: 'species',
	selectedIds: new Set(),
	location: null,
	filters: {
		kingdoms: new Set(),
		ranks: new Set(),
		hasPhotos: null,
		dateRange: { start: '', end: '' },
		location: '',
	},
}

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
	switch (action.type) {
		case 'SET_QUERY':
			return { ...state, query: action.payload }

		case 'SET_RESULTS':
			return {
				...state,
				results: action.payload,
				filteredResults: action.payload, // Initialize filtered results with all results
			}

		case 'SET_FILTERED_RESULTS':
			return { ...state, filteredResults: action.payload }

		case 'SET_VIEW_MODE':
			return { ...state, viewMode: action.payload }

		case 'SET_SEARCH_TYPE':
			return {
				...state,
				searchType: action.payload,
				// Clear results and selections when search type changes
				results: [],
				filteredResults: [],
				selectedIds: new Set(),
			}

		case 'SET_SELECTED_IDS':
			return {
				...state,
				selectedIds: ensureSet(action.payload),
			}

		case 'ADD_TO_SELECTION': {
			// Ensure we start with a Set
			const currentIds = ensureSet(state.selectedIds)
			const newSelectedIds = new Set(currentIds)
			action.payload.forEach((id) => newSelectedIds.add(id))
			return { ...state, selectedIds: newSelectedIds }
		}

		case 'REMOVE_FROM_SELECTION': {
			// Ensure we start with a Set
			const currentIds = ensureSet(state.selectedIds)
			const newSelectedIds = new Set(currentIds)
			action.payload.forEach((id) => newSelectedIds.delete(id))
			return { ...state, selectedIds: newSelectedIds }
		}

		case 'CLEAR_SELECTION':
			return { ...state, selectedIds: new Set() }

		case 'SET_LOCATION':
			return { ...state, location: action.payload }

		case 'SET_FILTERS': {
			// Ensure kingdoms and ranks are Sets
			const newFilters = { ...action.payload }
			newFilters.kingdoms = ensureSet(newFilters.kingdoms)
			newFilters.ranks = ensureSet(newFilters.ranks)
			return { ...state, filters: newFilters }
		}

		case 'UPDATE_FILTER': {
			const { key, value } = action.payload
			const newFilters = { ...state.filters }

			// Special handling for Set types
			if (key === 'kingdoms' || key === 'ranks') {
				newFilters[key] = ensureSet(value)
			} else {
				newFilters[key] = value
			}

			return { ...state, filters: newFilters }
		}

		case 'CLEAR_FILTERS':
			return {
				...state,
				filters: {
					kingdoms: new Set(),
					ranks: new Set(),
					hasPhotos: null,
					dateRange: { start: '', end: '' },
					location: '',
				},
			}

		case 'RESET_SEARCH_STATE':
			return {
				...state,
				results: [],
				filteredResults: [],
				selectedIds: new Set(),
				query: '',
			}

		default:
			return state
	}
}

type AppContextType = {
	// State
	query: string;
	results: any[];
	filteredResults: any[];
	viewMode: 'grid' | 'list' | 'map';
	searchType: 'species' | 'observations' | 'collections';
	selectedIds: Set<string>;
	location: { lat: number; lng: number } | null;
	filters: FilterState;

	// Actions
	setQuery: (query: string) => void;
	setResults: (results: any[]) => void;
	setFilteredResults: (results: any[]) => void;
	setViewMode: (mode: 'grid' | 'list' | 'map') => void;
	setSearchType: (type: 'species' | 'observations' | 'collections') => void;
	setSelectedIds: (ids: Set<string> | string[]) => void;
	addToSelection: (ids: string[]) => void;
	removeFromSelection: (ids: string[]) => void;
	clearSelection: () => void;
	setLocation: (location: { lat: number; lng: number } | null) => void;
	setFilters: (filters: FilterState) => void;
	updateFilter: (key: keyof FilterState, value: any) => void;
	clearFilters: () => void;
	resetSearchState: () => void;
	submitQuery: (query: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(appReducer, initialState)

	// Memoized action creators
	const setQuery = useCallback((query: string) => {
		dispatch({ type: 'SET_QUERY', payload: query })
	}, [])

	const setResults = useCallback((results: any[]) => {
		dispatch({ type: 'SET_RESULTS', payload: results })
	}, [])

	const setFilteredResults = useCallback((results: any[]) => {
		dispatch({ type: 'SET_FILTERED_RESULTS', payload: results })
	}, [])

	const setViewMode = useCallback((mode: 'grid' | 'list' | 'map') => {
		dispatch({ type: 'SET_VIEW_MODE', payload: mode })
	}, [])

	const setSearchType = useCallback(
		(type: 'species' | 'observations' | 'collections') => {
			dispatch({ type: 'SET_SEARCH_TYPE', payload: type })
		},
		[],
	)

	const setSelectedIds = useCallback((ids: Set<string> | string[]) => {
		dispatch({ type: 'SET_SELECTED_IDS', payload: ids })
	}, [])

	const addToSelection = useCallback((ids: string[]) => {
		dispatch({ type: 'ADD_TO_SELECTION', payload: ids })
	}, [])

	const removeFromSelection = useCallback((ids: string[]) => {
		dispatch({ type: 'REMOVE_FROM_SELECTION', payload: ids })
	}, [])

	const clearSelection = useCallback(() => {
		dispatch({ type: 'CLEAR_SELECTION' })
	}, [])

	const setLocation = useCallback(
		(location: { lat: number; lng: number } | null) => {
			dispatch({ type: 'SET_LOCATION', payload: location })
		},
		[],
	)

	const setFilters = useCallback((filters: FilterState) => {
		dispatch({ type: 'SET_FILTERS', payload: filters })
	}, [])

	const updateFilter = useCallback((key: keyof FilterState, value: any) => {
		dispatch({ type: 'UPDATE_FILTER', payload: { key, value } })
	}, [])

	const clearFilters = useCallback(() => {
		dispatch({ type: 'CLEAR_FILTERS' })
	}, [])

	const resetSearchState = useCallback(() => {
		dispatch({ type: 'RESET_SEARCH_STATE' })
	}, [])

	const submitQuery = useCallback(
		async (searchQuery: string) => {
			console.log(
				`Submitting query: ${searchQuery} for search type: ${state.searchType}`,
			)
			let endpoint = ''

			// Determine the API endpoint based on the searchType
			switch (state.searchType) {
				case 'species':
					endpoint = `https://api.inaturalist.org/v1/taxa?q=${searchQuery}`
					break
				case 'observations':
					endpoint = `https://api.inaturalist.org/v1/observations?q=${searchQuery}&photos=true`
					break
				case 'collections':
					endpoint = `https://api.inaturalist.org/v1/projects?q=${searchQuery}`
					break
				default:
					endpoint = `https://api.inaturalist.org/v1/taxa?q=${searchQuery}`
					break
			}

			try {
				const response = await fetch(endpoint)
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}
				const data = await response.json()
				dispatch({ type: 'SET_RESULTS', payload: data.results })
			} catch (error) {
				console.error('Error fetching data:', error)
				dispatch({ type: 'SET_RESULTS', payload: [] })
			}
		},
		[state.searchType],
	);

	// Ensure selectedIds is always a Set in the context value
	const safeSelectedIds = useMemo(
		() => ensureSet(state.selectedIds),
		[state.selectedIds],
	)

	// Ensure filters.kingdoms and filters.ranks are always Sets
	const safeFilters = useMemo(() => {
		return {
			...state.filters,
			kingdoms: ensureSet(state.filters.kingdoms),
			ranks: ensureSet(state.filters.ranks),
		}
	}, [state.filters])

	// Memoize the context value to prevent unnecessary re-renders
	const contextValue = useMemo(
		() => ({
			// State
			query: state.query,
			results: state.results,
			filteredResults: state.filteredResults,
			viewMode: state.viewMode,
			searchType: state.searchType,
			selectedIds: safeSelectedIds,
			location: state.location,
			filters: safeFilters,

			// Actions
			setQuery,
			setResults,
			setFilteredResults,
			setViewMode,
			setSearchType,
			setSelectedIds,
			addToSelection,
			removeFromSelection,
			clearSelection,
			setLocation,
			setFilters,
			updateFilter,
			clearFilters,
			resetSearchState,
			submitQuery,
		}),
		[
			state.query,
			state.results,
			state.filteredResults,
			state.viewMode,
			state.searchType,
			safeSelectedIds,
			state.location,
			safeFilters,
			setQuery,
			setResults,
			setFilteredResults,
			setViewMode,
			setSearchType,
			setSelectedIds,
			addToSelection,
			removeFromSelection,
			clearSelection,
			setLocation,
			setFilters,
			updateFilter,
			clearFilters,
			resetSearchState,
			submitQuery,
		],
	)

	return (
		<AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
	)
}

export function useAppContext() {
	const context = useContext(AppContext)
	if (context === undefined) {
		throw new Error('useAppContext must be used within an AppProvider')
	}
	return context
}
