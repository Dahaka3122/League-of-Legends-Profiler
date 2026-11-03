import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchProfile, parseRiotId } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("parseRiotId", () => {
  it("splits Name#TAG", () => {
    expect(parseRiotId("Faker#KR1")).toEqual({ name: "Faker", tag: "KR1" });
  });
  it("keeps spaces in names and trims whitespace", () => {
    expect(parseRiotId("  Hide on bush #KR1 ")).toEqual({ name: "Hide on bush", tag: "KR1" });
  });
  it("splits on the last # so names containing # still work", () => {
    expect(parseRiotId("a#b#EUW")).toEqual({ name: "a#b", tag: "EUW" });
  });
  it("rejects input without a name or tag", () => {
    expect(parseRiotId("Faker")).toBeUndefined();
    expect(parseRiotId("#KR1")).toBeUndefined();
    expect(parseRiotId("Faker#")).toBeUndefined();
    expect(parseRiotId("")).toBeUndefined();
  });
});

describe("fetchProfile", () => {
  it("requests the encoded URL and returns the JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ gameName: "Faker" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const profile = await fetchProfile("euw1", "Hide on bush", "KR1");

    expect(fetchMock).toHaveBeenCalledWith("/api/profile/euw1/Hide%20on%20bush/KR1");
    expect(profile).toMatchObject({ gameName: "Faker" });
  });

  it("surfaces the server's error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Player not found" }), { status: 404 })),
    );

    const err = await fetchProfile("euw1", "Nobody", "000").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("Player not found");
    expect((err as ApiError).status).toBe(404);
  });

  it("falls back to a generic message when the error body isn't JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 })));

    const err = await fetchProfile("euw1", "Faker", "KR1").catch((e: unknown) => e);

    expect((err as ApiError).message).toBe("Request failed (502)");
  });
});
