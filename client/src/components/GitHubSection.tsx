import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import GitHubCalendar from "react-github-calendar";

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

export function GitHubSection() {
  const { data: user, isLoading } = useQuery<GitHubUser>({
    queryKey: ["/api/github/user"],
  });

  if (isLoading || !user) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-slackey">githubz</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card - 1/3 width */}
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mb-2">{user.name}</h3>
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              @{user.login}
            </a>
            <p className="text-sm text-gray-600 mb-4">{user.bio}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Badge variant="secondary">
                {user.public_repos} repositories
              </Badge>
              <Badge variant="secondary">
                {user.followers} followers
              </Badge>
              <Badge variant="secondary">
                {user.following} following
              </Badge>
            </div>
          </div>
        </Card>
        
        {/* GitHub Calendar - 2/3 width */}
        <div className="md:col-span-2">
          <GitHubCalendar 
            username={user.login}
            colorScheme="light"
            fontSize={12}
          />
        </div>
      </div>
    </div>
  );
}
