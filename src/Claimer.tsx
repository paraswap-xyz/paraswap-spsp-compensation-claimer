import "./App.css";
import { useAccount, useEnsName } from "wagmi";
import {
  useBlockExploreLinkConstructors,
  useClaim,
  useClaimData,
  useIsClaimed,
} from "./hooks";
import { useMemo } from "react";
import { formatNumber, normalize } from "./utils";

function Claimer() {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const claimData = useClaimData();
  const userClaimData = useMemo(() => {
    if (!claimData.data || !address) return;
    return claimData.data.REWARDS_BY_STAKER.find(
      (s) => s.address == address.toLowerCase()
    );
  }, [claimData.data, address]);
  const claim = useClaim(userClaimData);
  const { constructTxExplorerLink, constructBlockExplorerLink } =
    useBlockExploreLinkConstructors();
  const isClaimedData = useIsClaimed(userClaimData?.index);

  if (claimData.isLoading || isClaimedData.isLoading)
    return <h3>Loading data...</h3>;

  if (claimData.error) {
    return (
      <h3>
        <span>An error happened could not fetch data</span>
        <span>Error: {claimData.error.message}</span>
      </h3>
    );
  }

  if (!address) return <h3>address not connected</h3>;

  if (!userClaimData) {
    return (
      <h2>
        <span className="address">{address}</span> had{" "}
        <span className="error">0</span> PSP staked in block{" "}
        {claimData.data.BLOCK_NUMBER} neither on ParaSwapPool4 (Apwine included)
        nor ParaSwapPool10
      </h2>
    );
  }

  const hasBoth =
    userClaimData.descr.rewards_from_spsp4 !== "0" &&
    userClaimData.descr.rewards_from_spsp10 !== "0";

  return (
    <div>
      <h1>
        Welcome <span className="address">{ensName ?? address}</span> !
      </h1>
      <h2>
        Claimable compensation:{" "}
        <span className="success">
          {formatNumber(normalize(userClaimData.rewards))} PSP
        </span>
      </h2>
      <button
        className="claimButton"
        disabled={!claim.write || isClaimedData.data}
        onClick={() => claim.write?.()}
      >
        {claim.isLoading
          ? "Claiming..."
          : isClaimedData.data
          ? "Claimed"
          : "Claim"}
      </button>
      {claim.data?.hash && (
        <h4>
          Follow transaction status on etherscan:{" "}
          <a href={constructTxExplorerLink(claim.data.hash)}>link</a>
        </h4>
      )}
      <div>
        <hr className="separator"></hr>
        {hasBoth && (
          <h3>
            <span className="info">
              {formatNumber(normalize(userClaimData.descr.rewards_from_spsp4))}{" "}
              PSP
            </span>{" "}
            compensation coming from ParaSwapPool4
          </h3>
        )}

        {userClaimData.descr.total_psp_staked_in_spsp4 !== "0" && (
          <h4>
            &#x21AA; You had{" "}
            <span className="info">
              {formatNumber(
                normalize(userClaimData.descr.total_psp_staked_in_spsp4)
              )}{" "}
              PSP
            </span>{" "}
            staked in sPSP4 at block{" "}
            <a
              href={constructBlockExplorerLink(claimData.data.BLOCK_NUMBER)}
              className="info"
            >
              {claimData.data.BLOCK_NUMBER}
            </a>
          </h4>
        )}

        {userClaimData.apwine_descr && (
          <h4>
            &#x21AA; Among which{" "}
            <span className="info">
              {formatNumber(
                normalize(
                  (
                    BigInt(userClaimData.apwine_descr.claimable_yield) +
                    BigInt(userClaimData.apwine_descr.expired_liquidity) +
                    BigInt(userClaimData.apwine_descr.fyt_accrued) +
                    BigInt(userClaimData.apwine_descr.pt_balance)
                  ).toString()
                )
              )}{" "}
              PSP
            </span>{" "}
            deposited in Apwine
          </h4>
        )}

        {hasBoth && (
          <h3>
            <span className="info">
              {formatNumber(normalize(userClaimData.descr.rewards_from_spsp10))}{" "}
              PSP
            </span>{" "}
            compensation coming from ParaSwapPool10
          </h3>
        )}

        {userClaimData.descr.total_psp_staked_in_spsp10 !== "0" && (
          <h4>
            &#x21AA; You had{" "}
            <span className="info">
              {formatNumber(
                normalize(userClaimData.descr.total_psp_staked_in_spsp10)
              )}{" "}
              PSP
            </span>{" "}
            staked in sPSP10 at block{" "}
            <a
              href={constructBlockExplorerLink(claimData.data.BLOCK_NUMBER)}
              className="info"
            >
              {claimData.data.BLOCK_NUMBER}
            </a>
          </h4>
        )}
      </div>
    </div>
  );
}

export default Claimer;
