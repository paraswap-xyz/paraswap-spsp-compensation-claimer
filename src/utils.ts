export const formatNumber = (num: number, maximumFractionDigits = 3) => {
  const formatter = new Intl.NumberFormat("en-EN", { maximumFractionDigits });

  return formatter.format(num);
};

export const normalize = (bignum: string, decimals: number = 18) => {
  return +bignum / 10 ** decimals;
};

const constructIpfsFetcher = (baseUrl: string) => async (ipfsHash: string) =>
  (await fetch(baseUrl + ipfsHash)).json();
const pinataFetcher = constructIpfsFetcher(
  "https://gateway.pinata.cloud/ipfs/"
);
const cloudflareFetcher = constructIpfsFetcher(
  "https://cloudflare-ipfs.com/ipfs/"
);
export const fetchDataOnIpfs = async (ipfsHash: string) => {
  try {
    return await pinataFetcher(ipfsHash);
  } catch {
    return await cloudflareFetcher(ipfsHash);
  }
};
