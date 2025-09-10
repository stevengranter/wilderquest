import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useNavigate } from 'react-router'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { QuestCard } from '@/components/QuestCard'
import { useQuestPhotoCollage } from '@/hooks/useTaxonPhotos'
import { QuestCardSkeleton } from '@/components/QuestCardSkeleton'
import { UserStats } from '@/components/UserStats'
import { useUserStats } from '@/hooks/useUserStats'
import { UserSearch } from '@/components/UserSearch'
import { type SafeUser } from '@/hooks/useUserSearch'
import { QuestWithTaxa } from '@/types/questTypes'
import { SingleAvatar } from '@/components/SingleAvatar'

function UserQuests({
    userId,
    isOwnProfile,
}: {
    userId: string
    isOwnProfile: boolean
}) {
    const {
        data: quests = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['userQuests', userId, { isOwnProfile }],
        queryFn: () =>
            api
                .get(`/quests/user/${userId}`)
                .then((res) => res.data as QuestWithTaxa[]),
        enabled: !!userId,
    })

    const { questToPhotosMap, isLoading: photosLoading } =
        useQuestPhotoCollage(quests)

    if (isLoading) {
        return (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden p-1">
                {[1, 2, 3].map((i) => (
                    <QuestCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Failed to load quests</p>
            </div>
        )
    }

    if (!quests || quests.length === 0) {
        return (
            <Card className="text-center py-8">
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">
                        No Quests Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {isOwnProfile
                            ? "You haven't created any quests yet. Get started by creating one!"
                            : "This user hasn't created any public quests yet."}
                    </p>
                    {isOwnProfile && (
                        <Button asChild>
                            <Link to="/quests/new">
                                Create Your First Quest
                            </Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden p-1">
            {quests.map((quest: QuestWithTaxa) => {
                const questPhotos = questToPhotosMap.get(quest.id) || []
                return (
                    <QuestCard
                        key={quest.id}
                        quest={quest}
                        photos={questPhotos}
                        isLoading={photosLoading && questPhotos.length === 0}
                        scaleTextToFit={true}
                    />
                )
            })}
        </div>
    )
}

const UserProfile = () => {
    const { username } = useParams<{ username: string }>()
    const { user: authUser } = useAuth()
    const navigate = useNavigate()
    const {
        data: user,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['user', username],
        queryFn: () => api.get(`/users/${username}`).then((res) => res.data),
        enabled: !!username,
    })

    const { data: userStats, isLoading: statsLoading } = useUserStats(username)

    const _handleUserSelect = (selectedUser: SafeUser) => {
        // Navigate to the selected user's profile
        navigate(`/users/${selectedUser.username}`)
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (error || !user) {
        return <div>User not found</div>
    }

    const isOwnProfile = authUser?.username === user.username

    return (
        <div className="container mx-auto px-4 py-8 overflow-hidden">
            <div className="mb-8">
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        <SingleAvatar
                            username={user.username}
                            className="w-24 h-24 border-2 border-foreground"
                        />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">
                            {user.username}'s Profile
                        </h1>
                        <UserStats
                            stats={userStats || null}
                            isLoading={statsLoading}
                        />
                        <p className="text-muted-foreground text-lg mt-2">
                            Exploring the wild, one quest at a time.
                        </p>
                    </div>
                </div>
            </div>

            {/*/!* User Search Section *!/*/}
            {/*<div className="mb-8">*/}
            {/*    <Card>*/}
            {/*        <CardContent className="p-6">*/}
            {/*            <h3 className="text-lg font-semibold mb-3">*/}
            {/*                Discover Other Users*/}
            {/*            </h3>*/}
            {/*            <p className="text-sm text-muted-foreground mb-4">*/}
            {/*                Search for other users to view their profiles and*/}
            {/*                quests.*/}
            {/*            </p>*/}
            {/*            <UserSearch*/}
            {/*                onUserSelect={handleUserSelect}*/}
            {/*                placeholder="Search for users..."*/}
            {/*                className="max-w-md"*/}
            {/*                excludeCurrentUser={true}*/}
            {/*            />*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*</div>*/}

            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">
                        Quests by {user.username}
                    </h2>
                    {isOwnProfile && (
                        <Button asChild>
                            <Link to="/quests/new">Create Quest</Link>
                        </Button>
                    )}
                </div>
                <UserQuests userId={user.id} isOwnProfile={isOwnProfile} />
            </div>
        </div>
    )
}

export default UserProfile
