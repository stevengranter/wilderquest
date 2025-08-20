/**
 * A centralized object for defining and building application paths.
 * This provides type-safety and autocompletion for routes.
 */
export const paths = {
	home: () => '/',

    // User paths
    users: () => '/users',
    userProfile: (username: string) => `/users/${username}`,

    // Quests paths
	quests: () => '/quests',
	newQuest: () => '/quests/new',
    editQuest: (id: string | number) => `/quests/${id}/edit`,
	questDetail: (id: string | number) => `/quests/${id}`,


};