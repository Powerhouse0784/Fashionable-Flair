// Auto-generated list of the 50 preset avatar portraits a testimonial
// author can pick from. Metro needs each require() written out
// literally (it statically scans for require() calls at build time —
// a loop building the path from a number won't be picked up), so this
// file exists purely to hold that static list in one place.
export const AVATARS: any[] = [
  require('@/assets/avatars/avatar-01.jpg'), // 1
  require('@/assets/avatars/avatar-02.jpg'), // 2
  require('@/assets/avatars/avatar-03.jpg'), // 3
  require('@/assets/avatars/avatar-04.jpg'), // 4
  require('@/assets/avatars/avatar-05.jpg'), // 5
  require('@/assets/avatars/avatar-06.jpg'), // 6
  require('@/assets/avatars/avatar-07.jpg'), // 7
  require('@/assets/avatars/avatar-08.jpg'), // 8
  require('@/assets/avatars/avatar-09.jpg'), // 9
  require('@/assets/avatars/avatar-10.jpg'), // 10
  require('@/assets/avatars/avatar-11.jpg'), // 11
  require('@/assets/avatars/avatar-12.jpg'), // 12
  require('@/assets/avatars/avatar-13.jpg'), // 13
  require('@/assets/avatars/avatar-14.jpg'), // 14
  require('@/assets/avatars/avatar-15.jpg'), // 15
  require('@/assets/avatars/avatar-16.jpg'), // 16
  require('@/assets/avatars/avatar-17.jpg'), // 17
  require('@/assets/avatars/avatar-18.jpg'), // 18
  require('@/assets/avatars/avatar-19.jpg'), // 19
  require('@/assets/avatars/avatar-20.jpg'), // 20
  require('@/assets/avatars/avatar-21.jpg'), // 21
  require('@/assets/avatars/avatar-22.jpg'), // 22
  require('@/assets/avatars/avatar-23.jpg'), // 23
  require('@/assets/avatars/avatar-24.jpg'), // 24
  require('@/assets/avatars/avatar-25.jpg'), // 25
  require('@/assets/avatars/avatar-26.jpg'), // 26
  require('@/assets/avatars/avatar-27.jpg'), // 27
  require('@/assets/avatars/avatar-28.jpg'), // 28
  require('@/assets/avatars/avatar-29.jpg'), // 29
  require('@/assets/avatars/avatar-30.jpg'), // 30
  require('@/assets/avatars/avatar-31.jpg'), // 31
  require('@/assets/avatars/avatar-32.jpg'), // 32
  require('@/assets/avatars/avatar-33.jpg'), // 33
  require('@/assets/avatars/avatar-34.jpg'), // 34
  require('@/assets/avatars/avatar-35.jpg'), // 35
  require('@/assets/avatars/avatar-36.jpg'), // 36
  require('@/assets/avatars/avatar-37.jpg'), // 37
  require('@/assets/avatars/avatar-38.jpg'), // 38
  require('@/assets/avatars/avatar-39.jpg'), // 39
  require('@/assets/avatars/avatar-40.jpg'), // 40
  require('@/assets/avatars/avatar-41.jpg'), // 41
  require('@/assets/avatars/avatar-42.jpg'), // 42
  require('@/assets/avatars/avatar-43.jpg'), // 43
  require('@/assets/avatars/avatar-44.jpg'), // 44
  require('@/assets/avatars/avatar-45.jpg'), // 45
  require('@/assets/avatars/avatar-46.jpg'), // 46
  require('@/assets/avatars/avatar-47.jpg'), // 47
  require('@/assets/avatars/avatar-48.jpg'), // 48
  require('@/assets/avatars/avatar-49.jpg'), // 49
  require('@/assets/avatars/avatar-50.jpg'), // 50
];

export const AVATAR_COUNT = AVATARS.length;

/** 1-based index, matching how it's stored in the database ("avatarIndex"). */
export function getAvatarByIndex(index: number): any {
  const i = Math.min(Math.max(Math.round(index) - 1, 0), AVATARS.length - 1);
  return AVATARS[i];
}

/** A random 1-based avatar index, used when a testimonial author doesn't pick one. */
export function randomAvatarIndex(): number {
  return Math.floor(Math.random() * AVATAR_COUNT) + 1;
}
