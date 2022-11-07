import { useAccount } from "wagmi";
import "./App.css";
import Claimer from "./Claimer";
import WalletConnect from "./WalletConnect";

function App() {
  const { isConnected } = useAccount();

  return (
    <div>
      {!isConnected ? (
        <>
          <h1>Claim Your ParaSwapPool 4 & 10 Compensation</h1>
          <WalletConnect />
        </>
      ) : (
        <Claimer />
      )}
    </div>
  );
}

export default App;
