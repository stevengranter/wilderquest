import * as React from 'react'
import { UserSearch } from './UserSearch'
import { type SafeUser } from '@/hooks/useUserSearch'

/**
 * Example component demonstrating how to use the UserSearch component
 * This can be added to any page where user search functionality is needed
 */
export function UserSearchExample() {
    const [selectedUser, setSelectedUser] = React.useState<SafeUser | null>(
        null
    )

    const handleUserSelect = (user: SafeUser) => {
        setSelectedUser(user)
        console.log('Selected user:', user)
        // Here you could:
        // - Navigate to user's profile
        // - Add user to a list
        // - Send an invitation
        // - etc.
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-2">User Search Demo</h3>
                <p className="text-sm text-foreground/70 mb-4">
                    Search for users by typing their username. The component
                    will show autocomplete suggestions.
                </p>

                <UserSearch
                    onUserSelect={handleUserSelect}
                    placeholder="Search for users to invite..."
                    className="max-w-md"
                />
            </div>

            {selectedUser && (
                <div className="p-4 border-2 border-border rounded-base bg-secondary-background">
                    <h4 className="font-medium">Selected User:</h4>
                    <p>
                        <strong>Username:</strong> {selectedUser.username}
                    </p>
                    <p>
                        <strong>User ID:</strong> {selectedUser.id}
                    </p>
                    <p>
                        <strong>Joined:</strong>{' '}
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                </div>
            )}

            <div className="text-sm text-foreground/60">
                <h4 className="font-medium mb-2">Usage Examples:</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li>Quest sharing - invite users to join quests</li>
                    <li>
                        Friend requests - send friend requests to other users
                    </li>
                    <li>Admin panels - search for users to manage</li>
                    <li>Messaging - start conversations with users</li>
                </ul>
            </div>
        </div>
    )
}
