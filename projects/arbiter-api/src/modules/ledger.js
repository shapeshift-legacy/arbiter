

import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Btc from "@ledgerhq/hw-app-btc";


/*
    Possible states
    TODO detect and inform of state
    No ledger pluged in (please acquire)
    Ledger plugged in but undetected (possible to detect this?)
    Ledger plugged in but not unlocked
    Ledger plugged in but wrong app (must be IN BTC app)
    Success:
        Prompt to click
        User MUST prompt
 */


let onGetLedgerBitcoinAddress = async function () {
    try {
        //this.setState({ error: null });
        const transport = await TransportU2F.create();
        const btc = new Btc(transport);
        const { bitcoinAddress } = await btc.getWalletPublicKey("44'/0'/0'/0");
        console.log("bitcoinAddress:",bitcoinAddress)

        let success = true
        let output = {success,bitcoinAddress}
        return output
    } catch (error) {
        console.error(error)
        let success = false
        let output = {success,error:"can not connect to ledger! "}
        //
        return output
    }
};
