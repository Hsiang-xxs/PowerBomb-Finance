import Image from "next/image";
import { useContext } from "react";
import { AccountContext, truncateAccount } from "../utils/accounts";

export default function NavBar({ icon, desc, account }) {
    const { config, setConfig } = useContext(AccountContext);
    
    const accountsClicked = (e) => {
        if (config.account) {
            setConfig({
                ...config,
                account: {
                    ...config?.account,
                    accountDetails: true
                }
            })
        }
    }

    return (<div className="navbar mb-2 text-neutral-content flex">
        <div className="flex-1 mpx-2 mx-2">
            <span className="text-lg font-bold">
                <Image src={icon || "/mask.png"} alt="logo" height="32px" width="32px" />
            </span>
        </div>
        {account && <div onClick={accountsClicked} className="w-auto flex items-center rounded bg-gray-700 hover:bg-gray-800 p-0.5 whitespace-nowrap text-sm font-bold cursor-pointer select-none pointer-events-auto">
            <div id="web3-status-connected" className="flex items-center px-3 py-2 text-sm rounded-lg bg-gray-900 text-white">
                <div className="mr-2">{truncateAccount(config)}</div>
            </div>
        </div>}
        <div className="flex-none px-2 mx-2 lg:flex">
            <div className="flex items-stretch">
                <a className="btn btn-ghost btn-xs rounded-btn">
                    About
                </a>
                <a className="btn btn-ghost btn-xs rounded-btn" href="https://medium.com/powerbombfinance">
                    Medium
                </a>
                <a className="btn btn-ghost btn-xs rounded-btn" href="https://twitter.com/powerbombfi?s=09">
                    Twitter
                </a>
            </div>
        </div>

    </div>);
}