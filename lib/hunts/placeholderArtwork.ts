// A hunt shows the Kitea Ao logo with a "Placeholder design" caption in
// place of its collectible art whenever it has no art_image_url configured
// yet — no per-hunt list to maintain here; a brand new hunt just needs
// art_image_url populated once real art exists.
export function isPlaceholderArtwork(artImageUrl: string | null | undefined): boolean {
  return artImageUrl == null
}

export const PLACEHOLDER_CAPTION_STYLE = {
  background: '#C4B08E',
  color:      '#0B2838',
} as const
