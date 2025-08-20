import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { ReactSVG } from 'react-svg'
import avatar from 'animal-avatar-generator'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { QuestWithTaxa } from '../../../types/types'
import { QuestCard } from '@/components/quest/QuestCard'

function UserQuests({ userId, isOwnProfile }: { userId: string, isOwnProfile: boolean }) {
  const {
    data: quests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userQuests', userId, { isOwnProfile }],
    queryFn: () =>
      api.get(`/quests/user/${userId}`).then((res) => res.data),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <Card className="h-full">
              <div className="h-32 bg-gray-200 rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load quests</p>
      </div>
    );
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
              <Link to="/quests/new">Create Your First Quest</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quests.map((quest: QuestWithTaxa) => (
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </div>
  );
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: authUser } = useAuth();
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', username],
    queryFn: () => api.get(`/users/${username}`).then((res) => res.data),
    enabled: !!username,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !user) {
    return <div>User not found</div>;
  }

  const avatarSvg = avatar(user.username, { size: 100 });
  const isOwnProfile = authUser?.username === user.username;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">

            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <ReactSVG
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                    avatarSvg
                  )}`}
                  className="w-20 h-20 rounded-full overflow-hidden border-2 border-border"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {user.username}'s Profile
                </h1>
                <p className="text-muted-foreground text-lg">
                  Exploring the wild, one quest at a time.
                </p>
              </div>
            </div>

      </div>

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
  );
};

export default UserProfile;
