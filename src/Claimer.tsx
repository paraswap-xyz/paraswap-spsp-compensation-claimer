import "./App.css";
import { useAccount, useEnsName } from "wagmi";
import { useClaim, useClaimData, useIsClaimed } from "./hooks";
import { useMemo } from "react";
import { formatNumber, normalize } from "./utils";

function Claimer() {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: globalClaimData, error: fetchError } = useClaimData();

  const userClaimData = useMemo(() => {
    if (!globalClaimData || !address) return;

    return globalClaimData.REWARDS_BY_STAKER.find(
      (s) => s.address == address.toLowerCase()
    );
  }, [globalClaimData, address]);
  const claim = useClaim(userClaimData);

  const isClaimedData = useIsClaimed(userClaimData?.index);

  if (!globalClaimData || fetchError) {
    return (
      <div>
        <div>An error happened could not fetch data</div>
        {(fetchError && <div>Error: {fetchError.message}</div>) || <></>}
      </div>
    );
  }

  if (!address) return <div>address not connected</div>;

  if (!userClaimData) {
    return (
      <h1>
        <span className="address">{address}</span> had{" "}
        <span className="error">0</span> PSP staked in block{" "}
        {globalClaimData.BLOCK_NUMBER} neither on ParaSwapPool4 (Apwine
        included) nor ParaSwapPool10
      </h1>
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
      <div>
        {isClaimedData.isLoading ? (
          <div>checking if claimed....</div>
        ) : isClaimedData.data ? (
          <div className="error">already claimed</div>
        ) : (
          <div>
            <button className="claimButton" disabled={!claim.write} onClick={() => claim.write?.()}>
              {claim.isLoading ? 'Claiming...': 'Claim'}
            </button>
          </div>
        )}
      </div>
      <h3>
        At block <span className="info">{globalClaimData.BLOCK_NUMBER}</span>
      </h3>
      <div>
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
            staked
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
            staked
          </h4>
        )}
      </div>
    </div>
  );
}

export default Claimer;
