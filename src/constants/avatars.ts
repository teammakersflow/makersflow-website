export interface PresetAvatar {
  id: string;
  name: string;
  url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'avatar-1', name: 'Felix', url: '/avatars/avatar-1.png' },
  { id: 'avatar-2', name: 'Aria', url: '/avatars/avatar-2.png' },
  { id: 'avatar-3', name: 'Leo', url: '/avatars/avatar-3.png' },
  { id: 'avatar-4', name: 'Maya', url: '/avatars/avatar-4.png' },
  { id: 'avatar-5', name: 'Sam', url: '/avatars/avatar-5.png' },
  { id: 'avatar-6', name: 'Zoe', url: '/avatars/avatar-6.png' },
  { id: 'avatar-7', name: 'Ethan', url: '/avatars/avatar-7.png' },
  { id: 'avatar-8', name: 'Chloe', url: '/avatars/avatar-8.png' },
  { id: 'avatar-9', name: 'Alex', url: '/avatars/avatar-9.png' },
  { id: 'avatar-10', name: 'Nora', url: '/avatars/avatar-10.png' },
  { id: 'avatar-11', name: 'Kai', url: '/avatars/avatar-11.png' },
  { id: 'avatar-12', name: 'Sofia', url: '/avatars/avatar-12.png' },
  { id: 'avatar-13', name: 'Sparky (Robot)', url: '/avatars/avatar-13.png' },
  { id: 'avatar-14', name: 'Byte (Robo-Pet)', url: '/avatars/avatar-14.png' },
];

export function getAvatarUrl(avatarKeyOrUrl?: string | null): string | null {
  if (!avatarKeyOrUrl) return null;
  const found = PRESET_AVATARS.find((a) => a.id === avatarKeyOrUrl);
  if (found) return found.url;
  if (
    avatarKeyOrUrl.startsWith('http://') ||
    avatarKeyOrUrl.startsWith('https://') ||
    avatarKeyOrUrl.startsWith('data:') ||
    avatarKeyOrUrl.startsWith('/')
  ) {
    return avatarKeyOrUrl;
  }
  return null;
}
