import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchProfile } from "./api";
import { ProfileMatches } from "./components/ProfileMatches";
import { ProfileHeader } from "./components/ProfileHeader";
import { SearchBar } from "./components/SearchBar";
import { useDDragon } from "./ddragon";

interface Lookup {
  region: string;
  name: string;
  tag: string;
}

export function App() {
  const [lookup, setLookup] = useState<Lookup>();
  const dd = useDDragon();

  const { data: profile, error, isFetching } = useQuery({
    queryKey: ["profile", lookup],
    queryFn: () => fetchProfile(lookup!.region, lookup!.name, lookup!.tag),
    enabled: lookup !== undefined,
    retry: false,
    staleTime: 2 * 60_000,
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          LoL <span className="text-win">Profile</span>
        </h1>
        <SearchBar loading={isFetching} onSearch={(region, name, tag) => setLookup({ region, name, tag })} />
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-loss bg-loss-bg p-4 text-center">
          {error.message}
        </p>
      )}

      {profile && (
        <main className="flex flex-col gap-6">
          <ProfileHeader profile={profile} version={dd.version} />
          <ProfileMatches key={`${profile.region}:${profile.puuid}`} profile={profile} dd={dd} />
        </main>
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-muted">
        Not endorsed by Riot Games. League of Legends © Riot Games, Inc.
      </footer>
    </div>
  );
}
