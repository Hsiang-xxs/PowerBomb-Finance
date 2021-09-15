import { getAPR, getDefaultProvider, getBalances, getDepositBalances } from "./harmony";

const strategy = {
    "harmony": {
        getAPR: getAPR,
        getDefaultProvider: getDefaultProvider,
        getTokenBalances: getBalances,
        getDepositBalances: getDepositBalances,
    }

}
export default strategy;