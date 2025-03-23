export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return 'tháng 1 năm 2025';

  const months = [
    'tháng 1',
    'tháng 2',
    'tháng 3',
    'tháng 4',
    'tháng 5',
    'tháng 6',
    'tháng 7',
    'tháng 8',
    'tháng 9',
    'tháng 10',
    'tháng 11',
    'tháng 12',
  ];

  return `${months[date.getMonth()]} năm ${date.getFullYear()}`;
};
