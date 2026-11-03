import { useState, type FormEvent } from "react";
import { parseRiotId } from "../api";
import { REGIONS } from "../types";

interface Props {
  initialRegion?: string;
  loading?: boolean;
  onSearch: (region: string, name: string, tag: string) => void;
}

export function SearchBar({ initialRegion = "euw1", loading = false, onSearch }: Props) {
  const [region, setRegion] = useState(initialRegion);
  const [riotId, setRiotId] = useState("");
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseRiotId(riotId);
    if (!parsed) {
      setError("Enter a Riot ID like Name#TAG");
      return;
    }
    setError(undefined);
    onSearch(region, parsed.name, parsed.tag);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-2xl">
      <div className="flex overflow-hidden rounded-lg border border-line bg-panel focus-within:border-win">
        <select
          aria-label="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="border-r border-line bg-panel-2 px-3 text-sm font-semibold outline-none"
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          aria-label="Riot ID"
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          placeholder="Game Name #TAG"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-win px-6 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-loss">
          {error}
        </p>
      )}
    </form>
  );
}
