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
import { fetchDataOnIpfs } from "./utils";

const useConfig = () => {
  const { chain } = useNetwork();
  return useMemo(() => {
    if (!chain) return { claimer: undefined, ipfsHash: undefined };
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
  const { ipfsHash } = useConfig();

  useEffect(() => {
    async function fetchData() {
      if (!ipfsHash) return;

      try {
        setIsLoading(true);
        const data = (await fetchDataOnIpfs(ipfsHash)) as FullClaimData;
        setIsLoading(false);
        setData(data);
      } catch (e) {
        setData(null);
        setIsLoading(false);
        setError(e as Error);
      }
    }

    fetchData();
  }, [ipfsHash]);

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

export const useBlockExplorerLinkConstructors = () => {
  const { chain } = useNetwork();

  return useMemo(() => {
    const baseUrl = chain?.blockExplorers?.etherscan?.url;

    return {
      constructTxExplorerLink: (txHash: string) => {
        if (!baseUrl) return;
        return `${baseUrl}/tx/${txHash}`;
      },
      constructBlockExplorerLink: (blockNumOrHash: string | number) => {
        if (!baseUrl) return;
        return `${baseUrl}/block/${blockNumOrHash}`;
      },
    };
  }, [chain]);
};
