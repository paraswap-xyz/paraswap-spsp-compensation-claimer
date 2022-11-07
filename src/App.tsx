import "./App.css";
import { useAccount, useConnect, useEnsName } from "wagmi";
import { useClaim, useClaimData, useIsClaimed } from "./hooks";
import { useMemo } from "react";
import { formatNumber, normalize } from "./utils";

function App() {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const {
    connect,
    connectors,
    error: connectError,
    isLoading,
    pendingConnector,
  } = useConnect();
  const { data: globalClaimData, error: fetchError } = useClaimData();

  const userClaimData = useMemo(() => {
    if (!globalClaimData || !address) return;

    return globalClaimData.REWARDS_BY_STAKER.find(
      (s) => s.address == address.toLowerCase()
    );
  }, [globalClaimData, address]);
  const { write } = useClaim(userClaimData);

  const isClaimedData = useIsClaimed(userClaimData?.index);

  if (!isConnected) {
    return (
      <div>
        {connectors.map((connector) => (
          <button
            disabled={!connector.ready}
            key={connector.id}
            onClick={() => connect({ connector })}
          >
            {connector.name}
            {isLoading &&
              pendingConnector?.id === connector.id &&
              " (connecting)"}
          </button>
        ))}
      </div>
    );
  }

  if (connectError) {
    return (
      <div>
        <div>An error happened could not connect wallet</div>
      </div>
    );
  }

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
      <div>
        Account {address} was not staked in block {globalClaimData.BLOCK_NUMBER}{" "}
        neither on sPSP10 nor sPSP4 (apwine included)
      </div>
    );
  }

  return (
    <div>
      <div>Hi {ensName ?? address} !</div>
      <div>
        <div>Rewards: {formatNumber(normalize(userClaimData.rewards))}</div>
        {isClaimedData.isLoading ? (
          <div>checking if claimed....</div>
        ) : isClaimedData.data ? (
          <div>already claimed </div>
        ) : (
          <div>
            <div>Write enabled: {String(!!write)}</div>
            <button disabled={!write} onClick={() => write?.()}>
              Claim
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
