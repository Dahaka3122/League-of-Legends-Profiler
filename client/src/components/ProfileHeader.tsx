import { profileIcon } from "../ddragon";
import type { Profile } from "../types";

export function ProfileHeader({ profile, version }: { profile: Profile; version: string }) {
  return (
    <section className="flex items-center gap-5 rounded-xl border border-line bg-panel p-5">
      <div className="relative">
        <img
          src={profileIcon(version, profile.profileIconId)}
          alt="Profile icon"
          className="h-24 w-24 rounded-xl border-2 border-gold object-cover"
        />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-line bg-panel-2 px-3 py-0.5 text-xs font-bold">
          {profile.level}
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-bold">
          {profile.gameName}
          <span className="ml-1 font-normal text-muted">#{profile.tagLine}</span>
        </h1>
        <p className="mt-1 text-sm uppercase tracking-wide text-muted">{profile.region}</p>
      </div>
    </section>
  );
}
