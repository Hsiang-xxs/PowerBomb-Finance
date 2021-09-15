import Head from 'next/head'
import Image from 'next/image'
import { useContext, useEffect, useState } from 'react'
import 'tailwindcss/tailwind.css'
import DepositView from '../accounts/deposits'
import useStickyState from '../common/useStickyState'
import { getAPR, getAvailableBalances, getDefaultProvider } from '../common/web3Layer'
import { AccountContext } from '../utils/accounts'

//
function Configuration({ account }) {
    const { config, setConfig } = useContext(AccountContext);

    const [deposit, setDeposit] = useState("");
    const [interest, setInterest] = useState("");
    const [tokenBalance, setTokenBalance] = useState(null);
    const [apr, setAPR] = useStickyState(null, "apr");

    const [loadingBalance, setLoading] = useState(false);
    const [powerBombValue, setValue] = useState(0);

    const powerbomb = async () => {
        if (!config?.account) {
            setConfig({
                ...config,
                account: {
                    ...config?.account,
                    accountDlg: true
                }
            });
            return;
        }
    }

    useEffect(e => {

        const fn = async () => {
            const apr = await getAPR({ provider: getDefaultProvider("harmony", "mainnet"), strategy: "harmony" })
            console.log(apr);
            setAPR(apr);
        }
        fn();
    }, []);

    const isValid = () => {
        return (tokenBalance && tokenBalance[deposit] && !isNaN(+tokenBalance[deposit].balance) && powerBombValue <= +tokenBalance[deposit].balance)
    }

    const selectionsMade = () => {
        return (isValid() && powerBombValue > 0 && interest.length > 0);
    }

    useEffect(e => {
        if (!account?.account) return;
        // get balance of all tokens we support!
        console.log(account);
        const fn = async () => {
            setLoading(true);
            const result = await getAvailableBalances({
                strategy: "harmony",
                provider: account?.provider,
                account: account?.account
            });
            setTokenBalance(result);
            console.log(result);
            setLoading(false);
        }
        fn();
    }, [account?.account])

    return (

        <div className="bg-gray-900 flex md:flex-row flex-col lg:p-1 p-1 w-full lg:gap-4 gap-2">
            <div className="bg-gray-700 rounded flex-1 flex flex-col">
                <div className="flex flex-row">
                    <div className="dropdown dropdown-top">
                        <div tabIndex="0" className="m-1 btn">Deposit</div>
                        <ul tabIndex="0" className="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-64">
                            <li>
                                <a className={"flex flex-row " + (tokenBalance && tokenBalance['usdt']?.balance === 0 && " opacity-25")} onClick={e => setDeposit("usdt")}><Image className="rounded" alt="usdt token" src="/tokens/usdt.jpeg" width="48px" height="48px" /> <span>1USDT</span></a>
                            </li>
                            <li>
                                <a className={"flex flex-row " + (tokenBalance && tokenBalance['usdc']?.balance === 0 && " opacity-25")} onClick={e => setDeposit("usdc")}><Image className="rounded" alt="usdc token" src="/tokens/usdc.jpeg" width="48px" height="48px" /> 1USDC</a>
                            </li>
                            <li>
                                <a className={"flex flex-row " + (tokenBalance && tokenBalance['lp']?.balance === 0 && " opacity-25")} onClick={e => setDeposit("lp")}><Image className="rounded" alt="usdt token" src="/tokens/lp.jpeg" width="48px" height="48px" /> 1USDT-1USDC-SP</a>
                            </li>
                        </ul>
                    </div>
                    {deposit.length > 0 && <div className="avatar">
                        <div className="m-2 w-10 h-10 mask mask-squircle">
                            {deposit.length > 0 && <Image src={"/tokens/" + deposit + ".jpeg"} alt="token" width="40px" height="40px"></Image>}
                        </div>
                    </div>}
                    {deposit.length > 0 && <div className="m-1">
                        <div className="font-thin text-sm">Balance:</div>
                        {!loadingBalance && <div className="text-lg">{tokenBalance && (!isNaN(tokenBalance[deposit].balance)) && "" + tokenBalance[deposit].balance || "-Connect-"}</div>}
                        {loadingBalance && <button className="btn btn-shadow btn-xs bg-gray-700 border-0 w-full loading"></button>}
                    </div>}
                </div>
                <div className="flex">
                    <div className="form-control flex-1 p-1">
                        <div className="relative">
                            <div data-tip={!isValid() ? "Invalid amount entered" : ""} className={"w-full z-40 " + (isValid() ? "" : "tooltip tooltip-secondary tooltip-bottom tooltip-open")}>
                                <input type="number" placeholder="Search" className={"input input-bordered w-full " + (isValid() ? "" : " input-error") } value={powerBombValue} onChange={e => setValue(e.target.value)} />
                            </div>
                            <button className="absolute top-0 right-0 rounded-l-none btn z-50" onClick={e => setValue(+tokenBalance[deposit].balance)} disabled={loadingBalance || deposit.length === 0 || !tokenBalance || isNaN(tokenBalance[deposit]?.balance)}>max</button>
                        </div>
                    </div>
                    {/* <input type="number" placeholder="Amount" className="flex-1 m-1 input input-bordered" /> */}
                </div>
            </div>

            {/* <button className="btn bg-gray-700 m-auto btn-circle"><Image src="/mask.png" width="36px" height="36px"></Image></button> */}
            <div className="avatar placeholder flex-none lg:m-auto ">
                <div onClick={powerbomb} className="cursor-pointer text-neutral-content md:rounded-full rounded md:w-28 md:h-28 h-12 w-full bg-gradient-to-r from-red-500 to-yellow-600 flex flex-col hover:bg-gradient-to-r hover:from-blue-400 hover:to-green-600">
                    <span className="md:text-lg text-sm text-center animate-pulse">
                        {apr && (apr?.yearlyAPR + "% APR") || "Loading"}
                    </span>
                    <span className="md:text-lg font-thin animate-bounce">
                        POWERBOMB
                    </span>
                </div>
            </div>
            <div className="bg-gray-700 rounded flex-1 flex flex-col">
                <div className="flex flex-row">
                    <div className="bg-gray-700">
                        <div className="dropdown dropdown-top">
                            <div tabIndex="0" className="m-1 btn">Interest</div>
                            <ul tabIndex="0" className="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-52">
                                <li>
                                    <a><Image onClick={e => setInterest("btc")} className="rounded" alt="btc token" src="/tokens/btc.jpeg" width="48px" height="48px" /> 1WBTC</a>
                                </li>
                                <li>
                                    <a><Image onClick={e => setInterest("eth")} className="rounded" alt="eth token" src="/tokens/eth.jpeg" width="48px" height="48px" /> 1ETH</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="avatar">
                        <div className="m-2 w-10 h-10 mask mask-squircle">
                            {interest.length > 0 && <Image src={"/tokens/" + interest + ".jpeg"} alt="token" width="40px" height="40px"></Image>}
                        </div>
                    </div>

                </div>
                <DepositView />

            </div>
        </div>
    )
}

export default Configuration;