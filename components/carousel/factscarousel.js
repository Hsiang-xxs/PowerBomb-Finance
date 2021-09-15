import { useRouter } from 'next/dist/client/router'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import 'tailwindcss/tailwind.css'
import { CountUp } from 'use-count-up'
import useStickyState from '../common/useStickyState'
import { getAPR, getAvailableBalances, getDefaultProvider } from '../common/web3Layer'

//
export default function FactsCarousel({ facts }) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [interval, setInterval] = useState(0);

  useEffect(e=>{
    if (!facts) return;
    window.clearInterval(interval);

    let currSlide = 0;

    setInterval(window.setInterval(e=>{
      
      currSlide ++;
      if (currSlide >= facts?.length) currSlide = 0;
      setCurrentSlide(currSlide);
      document.getElementById("slide" + currSlide)?.scrollIntoView();
    }, 12000));
  }, []);
  
  return (
    <div className="flex md:flex-row flex-col w-full gap-4 px-2">
      <div className="w-full carousel">
        {facts?.map((fact, id) => {
          return (<div key={id} id={"slide" + id} className="relative w-full flex flex-col text-center  carousel-item">
            <div className="md:text-xl text-lg font-thin">{fact.header}</div>
            <div className="md:text-xl text-lg md:pb-0">{fact.description}</div>

            <div className="">
              <div className="stats text-center">
                <div className="stat bg-opacity-0 pr-0">
                  <div className="stat-value text-dark md:text-5xl text-4xl">
                    <CountUp isCounting end={fact.total} duration={3.2} thousandsSeparator="," autoResetKey={currentSlide}/>
                  </div>
                  <div className="stat-desc text-dark">{fact.footer}</div>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
            <a href={"/#slide" + (id-1 < 0 ? facts.length - 1 : id - 1)} className="btn btn-circle border-0 bg-opacity-0">❮</a>
            <a href={"/#slide" + (id+1 >= facts.length ? 0 : id + 1)} className="btn btn-circle border-0 bg-opacity-0">❯</a>
          </div>
          </div>);
        })}

      </div>
    </div>
  )
}


