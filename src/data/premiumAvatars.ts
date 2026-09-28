// Auto-generated list of the 50 Premium-exclusive avatar portraits.
// Same static require() pattern as src/data/avatars.ts (Metro needs each
// require() written out literally) — this file exists purely to hold
// that static list in one place.
export const PREMIUM_AVATARS: any[] = [
  require('@/assets/avatars/premium/avatar-p01.jpg'), // 1
  require('@/assets/avatars/premium/avatar-p02.jpg'), // 2
  require('@/assets/avatars/premium/avatar-p03.jpg'), // 3
  require('@/assets/avatars/premium/avatar-p04.jpg'), // 4
  require('@/assets/avatars/premium/avatar-p05.jpg'), // 5
  require('@/assets/avatars/premium/avatar-p06.jpg'), // 6
  require('@/assets/avatars/premium/avatar-p07.jpg'), // 7
  require('@/assets/avatars/premium/avatar-p08.jpg'), // 8
  require('@/assets/avatars/premium/avatar-p09.jpg'), // 9
  require('@/assets/avatars/premium/avatar-p10.jpg'), // 10
  require('@/assets/avatars/premium/avatar-p11.jpg'), // 11
  require('@/assets/avatars/premium/avatar-p12.jpg'), // 12
  require('@/assets/avatars/premium/avatar-p13.jpg'), // 13
  require('@/assets/avatars/premium/avatar-p14.jpg'), // 14
  require('@/assets/avatars/premium/avatar-p15.jpg'), // 15
  require('@/assets/avatars/premium/avatar-p16.jpg'), // 16
  require('@/assets/avatars/premium/avatar-p17.jpg'), // 17
  require('@/assets/avatars/premium/avatar-p18.jpg'), // 18
  require('@/assets/avatars/premium/avatar-p19.jpg'), // 19
  require('@/assets/avatars/premium/avatar-p20.jpg'), // 20
  require('@/assets/avatars/premium/avatar-p21.jpg'), // 21
  require('@/assets/avatars/premium/avatar-p22.jpg'), // 22
  require('@/assets/avatars/premium/avatar-p23.jpg'), // 23
  require('@/assets/avatars/premium/avatar-p24.jpg'), // 24
  require('@/assets/avatars/premium/avatar-p25.jpg'), // 25
  require('@/assets/avatars/premium/avatar-p26.jpg'), // 26
  require('@/assets/avatars/premium/avatar-p27.jpg'), // 27
  require('@/assets/avatars/premium/avatar-p28.jpg'), // 28
  require('@/assets/avatars/premium/avatar-p29.jpg'), // 29
  require('@/assets/avatars/premium/avatar-p30.jpg'), // 30
  require('@/assets/avatars/premium/avatar-p31.jpg'), // 31
  require('@/assets/avatars/premium/avatar-p32.jpg'), // 32
  require('@/assets/avatars/premium/avatar-p33.jpg'), // 33
  require('@/assets/avatars/premium/avatar-p34.jpg'), // 34
  require('@/assets/avatars/premium/avatar-p35.jpg'), // 35
  require('@/assets/avatars/premium/avatar-p36.jpg'), // 36
  require('@/assets/avatars/premium/avatar-p37.jpg'), // 37
  require('@/assets/avatars/premium/avatar-p38.jpg'), // 38
  require('@/assets/avatars/premium/avatar-p39.jpg'), // 39
  require('@/assets/avatars/premium/avatar-p40.jpg'), // 40
  require('@/assets/avatars/premium/avatar-p41.jpg'), // 41
  require('@/assets/avatars/premium/avatar-p42.jpg'), // 42
  require('@/assets/avatars/premium/avatar-p43.jpg'), // 43
  require('@/assets/avatars/premium/avatar-p44.jpg'), // 44
  require('@/assets/avatars/premium/avatar-p45.jpg'), // 45
  require('@/assets/avatars/premium/avatar-p46.jpg'), // 46
  require('@/assets/avatars/premium/avatar-p47.jpg'), // 47
  require('@/assets/avatars/premium/avatar-p48.jpg'), // 48
  require('@/assets/avatars/premium/avatar-p49.jpg'), // 49
  require('@/assets/avatars/premium/avatar-p50.jpg'), // 50
];

export const PREMIUM_AVATAR_COUNT = PREMIUM_AVATARS.length;

/** 1-based index, matching how it is stored ("premiumAvatarIndex"). */
export function getPremiumAvatarByIndex(index: number): any {
  const i = Math.min(Math.max(Math.round(index) - 1, 0), PREMIUM_AVATARS.length - 1);
  return PREMIUM_AVATARS[i];
}

