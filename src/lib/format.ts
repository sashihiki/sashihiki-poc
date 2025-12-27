export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP');
};

export const formatCurrency = (amount: number) => {
  return `¥${amount.toLocaleString('ja-JP')}`;
};
