import * as React from 'react'
import { useState } from 'react'
import { Check, Search, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { useUserSearch, type SafeUser } from '@/hooks/useUserSearch'
import { useAuth } from '@/features/auth/useAuth'
import { AvatarOverlay } from '@/features/quests/components/AvatarOverlay'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'

interface UserSearchProps {
    onUserSelect?: (user: SafeUser) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    maxResults?: number
    excludeCurrentUser?: boolean
}

export function UserSearch({
    onUserSelect,
    placeholder = 'Search for users...',
    className,
    disabled = false,
    maxResults = 20,
    excludeCurrentUser = true,
}: UserSearchProps) {
    const { isAuthenticated, user: currentUser } = useAuth()
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null)

    const debouncedQuery = useDebounce(inputValue, 300)

    const {
        data: searchData,
        isLoading,
        error,
        isError,
    } = useUserSearch(debouncedQuery, open && isAuthenticated)

    // Filter out current user if requested
    const filteredUsers = React.useMemo(() => {
        if (!searchData?.users) return []

        let users = searchData.users

        if (excludeCurrentUser && currentUser) {
            users = users.filter((user) => user.id !== currentUser.id)
        }

        return users.slice(0, maxResults)
    }, [searchData?.users, excludeCurrentUser, currentUser, maxResults])

    const handleSelect = (user: SafeUser) => {
        setSelectedUser(user)
        setInputValue(user.username)
        setOpen(false)
        onUserSelect?.(user)
    }

    const handleClear = () => {
        setSelectedUser(null)
        setInputValue('')
        setOpen(false)
    }

    const handleInputChange = (value: string) => {
        setInputValue(value)
        if (value !== selectedUser?.username) {
            setSelectedUser(null)
        }
    }

    const handleInputFocus = () => {
        if (isAuthenticated && inputValue.length >= 2) {
            setOpen(true)
        }
    }

    const handleInputBlur = () => {
        // Keep open if there are results and user is typing
        if (!inputValue || inputValue.length < 2) {
            setOpen(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className={cn('relative', className)}>
                <div className="flex h-10 w-full items-center rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm text-foreground/50">
                    <Search className="mr-2 h-4 w-4" />
                    Please log in to search users
                </div>
            </div>
        )
    }

    return (
        <div className={cn('relative', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder={placeholder}
                            disabled={disabled}
                            className={cn(
                                'flex h-10 w-full items-center rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm font-base text-foreground file:border-0 file:bg-transparent file:text-sm file:font-heading placeholder:text-foreground/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                'pr-10', // Space for clear button
                                selectedUser && 'border-green-500',
                                className
                            )}
                            aria-label="Search for users"
                            aria-expanded={open}
                            aria-haspopup="listbox"
                            role="combobox"
                        />
                        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                            {isLoading && inputValue.length >= 2 && (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-transparent" />
                            )}
                            {inputValue && (
                                <Button
                                    type="button"
                                    variant="neutral"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-transparent"
                                    onClick={handleClear}
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                            <Search className="h-4 w-4 text-foreground/50" />
                        </div>
                    </div>
                </PopoverTrigger>

                <PopoverContent
                    className="w-full p-0"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Command>
                        <CommandList>
                            {isError && (
                                <div className="p-4 text-center text-sm text-red-600">
                                    {error?.message ===
                                    'Authentication required'
                                        ? 'Please log in to search users'
                                        : 'Failed to search users. Please try again.'}
                                </div>
                            )}

                            {!isError && inputValue.length < 2 && (
                                <CommandEmpty>
                                    Type at least 2 characters to search...
                                </CommandEmpty>
                            )}

                            {!isError &&
                                inputValue.length >= 2 &&
                                isLoading && (
                                    <div className="p-2">
                                        {Array.from({ length: 3 }).map(
                                            (_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3 p-2"
                                                >
                                                    <Skeleton className="h-8 w-8 rounded-full" />
                                                    <div className="flex-1 space-y-1">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                            {!isError &&
                                inputValue.length >= 2 &&
                                !isLoading &&
                                filteredUsers.length === 0 && (
                                    <CommandEmpty>No users found.</CommandEmpty>
                                )}

                            {!isError && filteredUsers.length > 0 && (
                                <CommandGroup>
                                    {filteredUsers.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            value={user.username}
                                            onSelect={() => handleSelect(user)}
                                            className="flex items-center gap-3 p-3"
                                        >
                                            <AvatarOverlay
                                                displayName={user.username}
                                                size={32}
                                                className=""
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {user.username}
                                                </span>
                                                <span className="text-xs text-foreground/60">
                                                    Joined{' '}
                                                    {new Date(
                                                        user.created_at
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {selectedUser?.id === user.id && (
                                                <Check className="ml-auto h-4 w-4 text-green-600" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
