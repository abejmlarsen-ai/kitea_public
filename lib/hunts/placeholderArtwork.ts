// Hunts whose collectible artwork isn't finalised yet. Anywhere a hunt's
// collectible image is shown (library grid/modal, post-scan popup), these
// hunts render the Kitea Ao logo with a "Placeholder design" caption
// instead of their configured art_image_url — even where one is set,
// since it's known to be interim art, not the final piece.
export const PLACEHOLDER_ARTWORK_HUNT_IDS: ReadonlySet<string> = new Set([
  '60a51267-efa5-4f60-9fa1-df1f394d6dbb', // Hunt 2 — Wanda Reserve
  'ccd5e1ef-3796-423a-a1f9-daddb7b3198a', // Hunt 5 — Darling Harbour
  'f5d9ab77-3f03-4d2f-a2e6-1bdebd212657', // Hunt 6 — Opera House
])

export function isPlaceholderArtworkHunt(huntLocationId: string | null | undefined): boolean {
  return !!huntLocationId && PLACEHOLDER_ARTWORK_HUNT_IDS.has(huntLocationId)
}

export const PLACEHOLDER_CAPTION_STYLE = {
  background: '#C4B08E',
  color:      '#0B2838',
} as const
