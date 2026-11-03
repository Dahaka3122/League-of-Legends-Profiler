import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchProfile } from "./api";
import { MasteryList } from "./components/MasteryList";
import { MatchList } from "./components/MatchList";
import { ProfileHeader } from "./components/ProfileHeader";
import { RankedCard } from "./components/RankedCard";
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
          <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
            <div className="flex flex-col gap-6">
              <RankedCard ranked={profile.ranked} />
              <MasteryList mastery={profile.topMastery} dd={dd} />
            </div>
            <MatchList matches={profile.matches} version={dd.version} />
          </div>
        </main>
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-muted">
        Not endorsed by Riot Games. League of Legends © Riot Games, Inc.
      </footer>
    </div>
  );
}
