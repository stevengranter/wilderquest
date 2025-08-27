import { useEffect, useMemo, useState } from 'react'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'

type QuestShare = {
    id: number
    token: string
    quest_id: number
    created_by_user_id: number
    guest_name?: string | null
    expires_at?: string | null
    created_at: string
    updated_at: string
}

export function ShareQuest({
    questId,
    ownerUserId,
}: {
    questId: number | string
    ownerUserId: number | string
}) {
    const { user } = useAuth()
    const isOwner = useMemo(() => {
        if (!user) return false
        return Number(ownerUserId) === Number(user.id)
    }, [user, ownerUserId])

    const [open, setOpen] = useState(false)
    const [shares, setShares] = useState<QuestShare[]>([])
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const [guestName, setGuestName] = useState('')
    const [expiresAt, setExpiresAt] = useState<string>('')

    useEffect(() => {
        if (!open || !isOwner) return
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
    }, [open, isOwner, questId])

    const createShare = async () => {
        setCreating(true)
        try {
            const payload: { guest_name?: string; expires_at?: string } = {}
            if (guestName) payload.guest_name = guestName
            if (expiresAt)
                payload.expires_at = new Date(expiresAt).toISOString()
            const res = await api.post(
                `/quest-sharing/quests/${questId}/shares`,
                payload
            )
            setShares((prev) => [res.data, ...prev])
            setGuestName('')
            setExpiresAt('')
        } catch (e) {
            console.error('Failed to create share', e)
        } finally {
            setCreating(false)
        }
    }

    const deleteShare = async (shareId: number) => {
        try {
            await api.delete(`/quest-sharing/shares/${shareId}`)
            setShares((prev) => prev.filter((s) => s.id !== shareId))
        } catch (e) {
            console.error('Failed to delete share', e)
        }
    }

    const buildShareLink = (token: string) => {
        // Placeholder guest URL for future UI. Token-based API is already active.
        return `${window.location.origin}/share/${token}`
    }

    if (!isOwner) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">Share Quest</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share this quest</DialogTitle>
                    <DialogDescription>
                        Create a share link to let someone mark species as
                        observed. Only you (the owner) can manage links.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="guestName">Guest name (optional)</Label>
                        <Input
                            id="guestName"
                            placeholder="e.g. Alex"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="expiresAt">Expires at (optional)</Label>
                        <Input
                            id="expiresAt"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={createShare} disabled={creating}>
                            {creating ? 'Creating…' : 'Create share link'}
                        </Button>
                    </div>
                </div>

                <div className="mt-4">
                    <h3 className="font-medium mb-2">Existing share links</h3>
                    {loading ? (
                        <div>Loading…</div>
                    ) : shares.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                            No shares yet.
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {shares.map((s) => (
                                <li
                                    key={s.id}
                                    className="border rounded-base p-3 flex flex-col gap-2"
                                >
                                    <div className="text-sm break-all">
                                        <span className="font-medium">
                                            Link:
                                        </span>{' '}
                                        <a
                                            href={buildShareLink(s.token)}
                                            className="underline"
                                        >
                                            {buildShareLink(s.token)}
                                        </a>
                                    </div>
                                    {s.guest_name ? (
                                        <div className="text-sm">
                                            Guest: {s.guest_name}
                                        </div>
                                    ) : null}
                                    {s.expires_at ? (
                                        <div className="text-xs text-muted-foreground">
                                            Expires:{' '}
                                            {new Date(
                                                s.expires_at
                                            ).toLocaleString()}
                                        </div>
                                    ) : null}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    buildShareLink(s.token)
                                                )
                                            }}
                                        >
                                            Copy link
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            size="sm"
                                            onClick={() => deleteShare(s.id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ShareQuest
