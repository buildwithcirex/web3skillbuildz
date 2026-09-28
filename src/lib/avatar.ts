// Animal pfps sliced from the sheet into public/avatars/01.png … 48.png.
export const AVATAR_COUNT = 48

// FNV-1a hash of the user id → stable avatar, so a user keeps the same pfp everywhere.
export function avatarFor(userId: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const n = ((h >>> 0) % AVATAR_COUNT) + 1
  return `/avatars/${String(n).padStart(2, '0')}.png`
}
