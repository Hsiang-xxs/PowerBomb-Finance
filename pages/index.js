import { ethers } from 'ethers'
import { useRouter } from 'next/dist/client/router'
import Head from 'next/head'
import Image from 'next/image'
import { useContext, useEffect, useState } from 'react'
import 'tailwindcss/tailwind.css'
import { CountUp } from 'use-count-up'
import FactsCarousel from '../components/carousel/factscarousel'
import NavBar from '../components/common/navbar'
import { main } from '../components/common/strategy/harmony'
import useStickyState from '../components/common/useStickyState'
import Configuration from '../components/deposits/Configuration'
import {AccountContext, connectAccount} from '../components/utils/accounts'
import WalletSelect from '../components/accounts/wallet-select'
import Accounts from '../components/accounts/accounts'

const FACTS = [{
  header:(<div>What if you could <strong>EARN</strong> interest on your dollars</div>),
  description: "... Except its paid in Bitcoin?",
  total: 105.3462,
  footer: "Bitcoin Paid back to Users"
}, {
  header:(<div>What if you could <strong>CHOOSE</strong> the rewards you're paid out in</div>),
  description: "... Get Bitcoin, Eth or USDT?",
  total: 1005.3462,
  footer: "Ethereum Paid back to Users"
}];
//
export default function Home() {
  const router = useRouter();
  const [apr, setAPR] = useStickyState(null, "apr");
  const [facts, setFacts] = useState(FACTS);
  const {config, setConfig} = useContext(AccountContext);

  console.log(config, setConfig);

  useEffect(e=>{
    if (apr === null || !apr.yearlyAPR) return;
    console.log("> Current APR is", apr);
    FACTS.push({
      header:(<div>Powerbomb helps earn <strong>PASSIVE</strong> income while you sleep</div>),
      description:"... " + apr?.yearlyAPR + " % APR on SushiSwap Harmony One",
      total:2325323,
      footer:"USD in TVL in Powerbomb"
    }); 
  }, [apr]);

  const connect = async () => {
    setConfig({
      ...config,
      account: {
        ...config?.account,
        accountDlg: true,
      }
    }) 
  }

  return (
    <div style={{
      backgroundImage: "url('/background.jpeg')",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
      backgroundSize: "100% 100%",
      backgroundColor: "rgba(0,0,0,0.7)",
      backgroundBlendMode: "darken"
    }} className="h-screen w-screen container-fluid px-0 backdrop-filter backdrop-blur-lg">
      <WalletSelect/>
      <Accounts/>
      <div className="fixed w-screen bg-black bg-opacity-25 z-10">
        <div className="container-fluid text-center bg-primary font-thin text-dark py-1 mb-2"> Always make sure your browser is on <strong>powerbomb.finance</strong> before interacting with the app! </div>
        <NavBar account={config?.account}/>
      </div>

      <div className="md:pt-28 pt-12 h-screen flex flex-col w-screen items-center overflow-y-scroll z-0">

        <div className="md:visible invisible"><Image src="/logo.png" alt="logo" width="200px" height="80px" /></div>
        <div className="md:text-2xl text-xl pb-4 text-center">Power up your earnings with Powerbomb</div>
        <FactsCarousel facts={facts}/>

        <div className="lg:w-3/4 w-full">
          <Configuration account={config?.account} />
        </div>
        <div className="flex flex-row gap-4 m-4 flex-wrap justify-center">
          <div className="flex gap-4">
          {config?.account?.account && <button className="btn bg-gradient-to-r from-purple-500 to-purple-600 ring-red-500 ring-opacity-25 hover:pulse hover:bg-gradient-to-r hover:from-blue-400 hover:to-green-600">Harvest</button>}
          {config?.account?.account && <button className="btn bg-gradient-to-r from-purple-500 to-purple-600 ring-red-500 ring-opacity-25 hover:pulse hover:bg-gradient-to-r hover:from-blue-400 hover:to-green-600">Withdraw</button>}
          </div>
          {!config?.account?.account && <button onClick={connect} className="btn bg-gradient-to-r from-blue-600 to-red-600 ring-2 hover:bg-gradient-to-r hover:from-red-500 hover:to-yellow-600 ring-gray-500 ring-opacity-25">Connect Wallet</button>}
          <button className="btn btn-ghost">Learn More</button>
        </div>

      </div>
    </div>
  )
}
