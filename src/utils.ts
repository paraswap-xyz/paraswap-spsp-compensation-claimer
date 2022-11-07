export const formatNumber = (num: number, maximumFractionDigits = 3) => {
  const formatter = new Intl.NumberFormat("en-EN", { maximumFractionDigits });

  return formatter.format(num);
};

export const normalize = (bignum: string, decimals: number = 18) => {
  return +bignum / 10 ** decimals;
};
