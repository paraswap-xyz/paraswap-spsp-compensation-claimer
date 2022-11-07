const formatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });

export const formatNumber = (num: number) => {
  return formatter.format(num);
};

export const normalize = (bignum: string, decimals: number = 18) => {
  return +bignum / 10 ** decimals;
};
