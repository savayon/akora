// UUID를 기반으로 항상 일관된 랜덤 색상을 반환하는 유틸리티
// UUID 문자열을 해싱하여 배열의 인덱스를 결정합니다.

const COLOR_CLASSES = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-teal-100 text-teal-700 border-teal-200',
];

export function getAvatarColor(uuid: string | undefined | null): string {
  if (!uuid) return 'bg-slate-100 text-slate-500 border-slate-200'; // 탈퇴 유저(null)

  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = uuid.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 음수 해시를 양수로 변환
  const index = Math.abs(hash) % COLOR_CLASSES.length;
  return COLOR_CLASSES[index];
}
