import { useConnect } from "wagmi";

export default function WalletConnect() {
  const {
    connect,
    connectors,
    error: connectError,
    isLoading,
    pendingConnector,
  } = useConnect();

  if (connectError) {
    return (
      <h3 className="error">An error happened could not connect wallet</h3>
    );
  }

  return (
    <div className="wallets-container">
      {connectors
        .filter((connector) => connector.ready)
        .map((connector) => (
          <button
            className="wallet"
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
