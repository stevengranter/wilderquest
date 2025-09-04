import { useEffect, useMemo, useState } from 'react'
import { FaShareFromSquare, FaPlus } from 'react-icons/fa6'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { UserSearch } from '@/components/UserSearch'
import { type SafeUser } from '@/hooks/useUserSearch'

type QuestShare = {
    id: number
    token: string
    quest_id: number
    created_by_user_id: number
    guest_name?: string | null
    shared_with_user_id?: number | null
    invited_username?: string | null
    expires_at?: string | null
    is_primary?: boolean
    created_at: string
    updated_at: string
}

export function ShareQuest({
    questId,
    ownerUserId,
    questName,
    showDrawerOnly = false,
    showForm: externalShowForm,
    onToggleForm: externalOnToggleForm,
}: {
    questId: number | string
    ownerUserId: number | string
    questName?: string
    showDrawerOnly?: boolean
    showForm?: boolean
    onToggleForm?: (show: boolean) => void
}) {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const isOwner = useMemo(() => {
        if (!user) return false
        return Number(ownerUserId) === Number(user.id)
    }, [user, ownerUserId])

    const [internalShowForm, setInternalShowForm] = useState(false)
    const showForm =
        externalShowForm !== undefined ? externalShowForm : internalShowForm
    const setShowForm = externalOnToggleForm || setInternalShowForm
    const [_shares, setShares] = useState<QuestShare[]>([])
    const [_loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const [invitationMode, setInvitationMode] = useState<'guest' | 'user'>(
        'guest'
    )
    const [guestName, setGuestName] = useState('')
    const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null)
    const [expiresAt, setExpiresAt] = useState<string>('')

    useEffect(() => {
        if (!showForm || !isOwner) return
        const fetchShares = async () => {
            setLoading(true)
            try {
                const res = await api.get(
                    `/quest-sharing/quests/${questId}/shares`
                )
                setShares(res.data || [])
            } catch (e) {
                console.error('Failed to load shares', e)
            } finally {
                setLoading(false)
            }
        }
        fetchShares()
    }, [showForm, isOwner, questId])

    const createShare = async () => {
        setCreating(true)
        try {
            const payload: {
                guest_name?: string
                shared_with_user_id?: number
                expires_at?: string
            } = {}

            if (invitationMode === 'guest') {
                if (guestName) payload.guest_name = guestName
            } else if (invitationMode === 'user' && selectedUser) {
                payload.shared_with_user_id = selectedUser.id
            }

            if (expiresAt)
                payload.expires_at = new Date(expiresAt).toISOString()

            const res = await api.post(
                `/quest-sharing/quests/${questId}/shares`,
                payload
            )
            setShares((prev) => [res.data, ...prev])

            // Reset form
            if (invitationMode === 'guest') {
                setGuestName('')
            } else {
                setSelectedUser(null)
            }
            setExpiresAt('')

            // Invalidate leaderboard queries so they update immediately
            queryClient.invalidateQueries({
                queryKey: ['leaderboard', questId],
            })
        } catch (e) {
            console.error('Failed to create share', e)
        } finally {
            setCreating(false)
        }
    }

    const _deleteShare = async (shareId: number) => {
        try {
            await api.delete(`/quest-sharing/shares/${shareId}`)
            setShares((prev) => prev.filter((s) => s.id !== shareId))

            // Invalidate leaderboard queries so they update immediately
            queryClient.invalidateQueries({
                queryKey: ['leaderboard', questId],
            })
        } catch (e) {
            console.error('Failed to delete share', e)
        }
    }

    const _buildShareLink = (token: string) => {
        // Placeholder guest URL for future UI. Token-based API is already active.
        return `${window.location.origin}/share/${token}`
    }

    if (!isOwner) return null

    return (
        <div className={showDrawerOnly ? 'w-full' : 'relative'}>
            {!showDrawerOnly && (
                <Button
                    size="sm"
                    onClick={() => setShowForm(!showForm)}
                    variant="default"
                >
                    <FaPlus className="h-4 w-4 mr-2" />
                    Invite Explorer
                </Button>
            )}

            <AnimatePresence>
                {showForm && showDrawerOnly && (
                    <motion.div
                        initial={{ opacity: 0, maxHeight: 0, y: -5 }}
                        animate={{ opacity: 1, maxHeight: 500, y: 0 }}
                        exit={{
                            opacity: 0,
                            maxHeight: 0,
                            y: -5,
                            transition: {
                                maxHeight: { duration: 0.2, ease: 'easeInOut' },
                                opacity: { duration: 0.15, delay: 0.05 },
                                y: { duration: 0.2, ease: 'easeInOut' },
                            },
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 40,
                            mass: 0.6,
                            opacity: { duration: 0.1 },
                        }}
                        className="overflow-hidden bg-background border border-slate-400 rounded-xl shadow-sm p-3"
                    >
                        <div className="space-y-4">
                            {/* Invitation Mode Toggle */}
                            <div className="space-y-2">
                                <Label>Invitation type</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={
                                            invitationMode === 'guest'
                                                ? 'default'
                                                : 'neutral'
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setInvitationMode('guest')
                                        }
                                    >
                                        Invite Guest
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            invitationMode === 'user'
                                                ? 'default'
                                                : 'neutral'
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setInvitationMode('user')
                                        }
                                    >
                                        Invite User
                                    </Button>
                                </div>
                            </div>

                            {/* Guest Invitation Form */}
                            {invitationMode === 'guest' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="guestName">
                                        Guest name (optional)
                                    </Label>
                                    <Input
                                        id="guestName"
                                        placeholder="e.g. Alex"
                                        value={guestName}
                                        onChange={(e) =>
                                            setGuestName(e.target.value)
                                        }
                                    />
                                </div>
                            )}

                            {/* User Invitation Form */}
                            {invitationMode === 'user' && (
                                <div className="space-y-2">
                                    <Label>Search for user to invite</Label>
                                    <UserSearch
                                        onUserSelect={setSelectedUser}
                                        placeholder="Search users..."
                                        className="w-full"
                                    />
                                    {selectedUser && (
                                        <div className="text-sm text-muted-foreground">
                                            Selected:{' '}
                                            <span className="font-medium">
                                                {selectedUser.username}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="expiresAt">
                                    Expires at (optional)
                                </Label>
                                <Input
                                    id="expiresAt"
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) =>
                                        setExpiresAt(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={createShare}
                                    disabled={
                                        creating ||
                                        (invitationMode === 'user' &&
                                            !selectedUser)
                                    }
                                    size="sm"
                                >
                                    {creating
                                        ? 'Creating…'
                                        : 'Create invitation'}
                                </Button>
                                <Button
                                    variant="neutral"
                                    size="sm"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ShareQuest
