import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import "./App.css";
import Claimer from "./Claimer";
import WalletConnect from "./WalletConnect";

const supportedChainId = 5;

function App() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork, chains } = useSwitchNetwork();
  const supportedChain = chains.find((e) => e.id === supportedChainId);

  return (
    <div>
      {!isConnected ? (
        <>
          <h1>Claim Your ParaSwapPool 4 & 10 Compensation</h1>
          <WalletConnect />
        </>
      ) : chain?.id != supportedChainId ? (
        <h3
          className="error"
          style={{ display: "flex", alignItems: "center", columnGap: 10 }}
        >
          Connected to wrong chain please switch to {supportedChain?.name}{" "}
          <button
            style={{ fontSize: 20, backgroundColor: "white", color: "red" }}
            onClick={() => switchNetwork?.(supportedChainId)}
          >
            switch
          </button>
        </h3>
      ) : (
        <Claimer />
      )}
    </div>
  );
}

export default App;
