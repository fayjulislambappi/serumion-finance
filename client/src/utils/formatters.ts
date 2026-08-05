export const formatCurrency = (val?: number): string => {
  const num = val || 0;
  return '৳' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};
