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
    <div style={{ display: "flex", columnGap: 10, justifyContent: "center" }}>
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
