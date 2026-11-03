const ICON_ID_FIXES: Record<string, string> = {
  FiddleSticks: "Fiddlesticks",
};

export function championIconId(championName: string): string {
  return ICON_ID_FIXES[championName] ?? championName;
}
