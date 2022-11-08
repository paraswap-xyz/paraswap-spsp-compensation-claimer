import { useEffect, useMemo, useState } from "react";
import {
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useNetwork,
} from "wagmi";
import { FullClaimData, HexData, UserClaimData } from "./types";
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

type ClaimDataState =
  | { isLoading: true; data: null; error: undefined }
  | { isLoading: false; data: FullClaimData; error: undefined }
  | { isLoading: false; data: null; error: Error };

export const useClaimData = (): ClaimDataState => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<FullClaimData | null>(null);
  const [error, setError] = useState<Error>();
  const { url } = useConfig();

  useEffect(() => {
    async function fetchData() {
      if (!url) return;

      try {
        setIsLoading(true);
        const data = (await (await fetch(url)).json()) as FullClaimData;
        setIsLoading(false);
        setData(data);
      } catch (e) {
        setData(null);
        setIsLoading(false);
        setError(e as Error);
      }
    }

    fetchData();
  }, [url]);

  return {
    isLoading,
    data,
    error,
  } as ClaimDataState;
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

export const useBlockExploreLinkConstructors = () => {
  const { chain } = useNetwork();

  return useMemo(() => {
    const baseUrl = chain?.blockExplorers?.etherscan?.url;

    return {
      getTxExplorerLink: (txHash: string) => {
        if (!baseUrl) return;
        return `${baseUrl}/tx/${txHash}`;
      },
      getBlockExplorerLink: (blockNumOrHash: string | number) => {
        if (!baseUrl) return;
        return `${baseUrl}/block/${blockNumOrHash}`;
      },
    };
  }, [chain]);
};
