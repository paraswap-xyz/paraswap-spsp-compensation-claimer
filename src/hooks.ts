import { useEffect, useMemo, useState } from "react";
import {
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useNetwork,
} from "wagmi";
import { GlobalClaimData, HexData, UserClaimData } from "./types";
import MerkleDistributorABI from "./MerkleDistributorABI";
import { BigNumber } from "ethers";
import config from "./config";

const useConfig = () => {
  const { chain } = useNetwork();
  return useMemo(() => {
    if (!chain) return { url: undefined, claimer: undefined };
    return config[chain.id];
  }, [config, chain]);
};

export const useClaimData = () => {
  const [data, setData] = useState<GlobalClaimData | null>(null);
  const [error, setError] = useState<Error>();
  const { url } = useConfig();

  useEffect(() => {
    async function fetchData() {
      if (!url) return;

      try {
        const data = (await (await fetch(url)).json()) as GlobalClaimData;
        setData(data);
      } catch (e) {
        setData(null);
        setError(e as Error);
      }
    }

    fetchData();
  }, [url]);

  return {
    data,
    error,
  };
};

export const useIsClaimed = (index?: number) => {
  const { claimer } = useConfig();
  const args = useMemo(() => {
    if (index === undefined) return;
    return [BigNumber.from(index)] as const;
  }, [index]);

  const { data, isError, isLoading } = useContractRead({
    address: claimer,
    abi: MerkleDistributorABI,
    functionName: "isClaimed",
    args,
    enabled: !!args && !!claimer,
  });

  return { data, isError, isLoading };
};

export const useClaim = (claimData?: UserClaimData) => {
  const { claimer } = useConfig();

  const args = useMemo(() => {
    if (!claimData) return;
    return [
      BigNumber.from(claimData.index),
      claimData.address as HexData,
      BigNumber.from(claimData.rewards),
      claimData.proof as HexData[],
    ] as const;
  }, [claimData]);

  const { config } = usePrepareContractWrite({
    address: claimer,
    abi: MerkleDistributorABI,
    functionName: "claim",
    args,
    enabled: !!args && !!claimer,
  });
  const { data, isError, isLoading, write } = useContractWrite(config);

  return { data, isError, isLoading, write };
};

export const useBlockExplorerTxLink = (txHash?: string) => {
  const { chain } = useNetwork();
  return useMemo(() => {
    if (!txHash || !chain?.blockExplorers?.etherscan) return;
    return `${chain.blockExplorers.etherscan.url}/tx/${txHash}`;
  }, [txHash]);
};
