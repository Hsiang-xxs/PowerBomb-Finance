const {
    getNamedAccounts,
    getUnnamedAccounts,
    deployments,
    getChainId,
    ethers,
    network,
  } = require("hardhat");
  const { expectRevert } = require('@openzeppelin/test-helpers');
  const { assert, expect } = require("chai");
  const { BigNumber } = require('bignumber.js');
  BigNumber.config({
    EXPONENTIAL_AT: 1e+9,
    ROUNDING_MODE: BigNumber.ROUND_FLOOR,
  })
  
  const ERC20_ABI = require("../node_modules/@openzeppelin/contracts/build/contracts/ERC20.json").abi;
  const { mainnet: network_ } = require("../parameters");
  
  const { AddressZero, blockTimestamp, increaseTime, UInt256Max } = require('./utils/Ethereum');
  

  describe("PowerBomb", async () => {
    const ProfitSharingFeePerc = 500;
    const Amount = 100e6;

    let powerBomb;
    let usdt, usdc, slp, one, sushi, eth;
    let sushiSwapRouter, sushiSwapChef;
    let a1;

  
    before(async () => {
      a1 = await ethers.getSigner(process.env.IMPERSONATED_ACCOUNT);

      [owner] = await ethers.getSigners();
  
      await deployments.fixture(["hardhat_PowerBombUpgradeable_deploy"])
  
      const implArtifact = await deployments.getArtifact("PowerBombUpgradeable");
      const powerBombUpgradeableProxy = await ethers.getContract("PowerBombUpgradeableProxy");
      powerBomb = new ethers.Contract(powerBombUpgradeableProxy.address, implArtifact.abi, a1);
  
      usdt = new ethers.Contract(network_.PowerBomb.usdt, ERC20_ABI, a1);
      usdc = new ethers.Contract(network_.PowerBomb.usdc, ERC20_ABI, a1);
      slp = new ethers.Contract(network_.PowerBomb.slp, ERC20_ABI, a1);
      one = new ethers.Contract(network_.PowerBomb.one, ERC20_ABI, a1);
      sushi = new ethers.Contract(network_.PowerBomb.sushi, ERC20_ABI, a1);
      eth = new ethers.Contract(network_.PowerBomb.eth, ERC20_ABI, a1);

      const sushiSwapRouterArtifact = await deployments.getArtifact("ISushiSwapV2Router02");
      sushiSwapRouter = new ethers.Contract(network_.PowerBomb.sushiSwapRouter, sushiSwapRouterArtifact.abi, a1);
      const sushiSwapChefArtifact = await deployments.getArtifact("ISushiSwapV2MiniChef");
      sushiSwapChef = new ethers.Contract(network_.PowerBomb.sushiSwapChef, sushiSwapChefArtifact.abi, a1);

      await usdt.connect(a1).approve(powerBomb.address, UInt256Max());
      await usdc.connect(a1).approve(powerBomb.address, UInt256Max());
      await slp.connect(a1).approve(powerBomb.address, UInt256Max());

      await powerBomb.connect(owner).setTreasuryWallet(owner.address);
    });

  
    describe('Configuration', () => {
      it("Should be set with correct initial value", async () => {
          expect(await powerBomb.owner()).equal(owner.address);

          assert.equal(await powerBomb.usdt1(), await ethers.utils.getAddress(usdt.address), "The USDT address disagreement");
          assert.equal(await powerBomb.usdc1(), await ethers.utils.getAddress(usdc.address), "The USDC address disagreement");
          assert.equal(await powerBomb.slp(), await ethers.utils.getAddress(slp.address), "The SLP address disagreement");
          assert.equal(await powerBomb.one(), await ethers.utils.getAddress(one.address), "The ONE address disagreement");
          assert.equal(await powerBomb.sushi(), await ethers.utils.getAddress(sushi.address), "The SUSHI address disagreement");
          assert.equal(await powerBomb.rewardToken(), await ethers.utils.getAddress(eth.address), "The ETH address disagreement");
          assert.equal(await powerBomb.sushiSwapRouter(), await ethers.utils.getAddress(sushiSwapRouter.address), "The SushiSwapRouter address disagreement");
          assert.equal(await powerBomb.sushiSwapChef(), await ethers.utils.getAddress(sushiSwapChef.address), "The SushiSwapChef address disagreement");
          assert.equal(await powerBomb.profitSharingFeePerc(), ProfitSharingFeePerc, "The profitSharingFeePerc disagreement");
          assert.equal(await powerBomb.lastTime(), 0, "The lastTime disagreement");
          assert.equal(await powerBomb.totalSLPAmount(), 0, "The totalSLPAmount disagreement");
          assert.equal(await powerBomb.totalFarmedONE(), 0, "The totalFarmedONE disagreement");
          assert.equal(await powerBomb.totalFarmedSUSHI(), 0, "The totalFarmedSUSHI disagreement");
          assert.equal(await powerBomb.totalPendingONESold(), 0, "The totalPendingONESold disagreement");
          assert.equal(await powerBomb.totalPendingSUSHISold(), 0, "The totalPendingSUSHISold disagreement");
          assert.equal(await powerBomb.totalBoughtToken(), 0, "The totalBoughtToken disagreement");
          assert.equal(await powerBomb.totalPendingTokenFromONE(), 0, "The totalPendingTokenFromONE disagreement");
          assert.equal(await powerBomb.accONEPerSLP(), 0, "The accONEPerSLP disagreement");
          assert.equal(await powerBomb.accSUSHIPerSLP(), 0, "The accSUSHIPerSLP disagreement");
          assert.equal(await powerBomb.rewarder(), await sushiSwapChef.rewarder(await powerBomb.pid()), "The rewarder disagreement");
          assert.equal(await powerBomb.treasuryWallet(), owner.address, "The lastTime disagreement");
        });
    });

  
    describe('Interaction', () => {
      it('Should succeed to deposit as expected', async () => {
        var usdcBalanceBefore = await usdc.balanceOf(a1.address);
        var slpAmountRecordedBefore = (await powerBomb.userInfo(a1.address))["slpAmount"];
        var finishedONERecordedBefore = (await powerBomb.userInfo(a1.address))["finishedONE"];
        var finishedSUSHIRecordedBefore = (await powerBomb.userInfo(a1.address))["finishedSUSHI"];
        var totalSLPAmountRecordedBefore = await powerBomb.totalSLPAmount();

        assert.equal(slpAmountRecordedBefore, 0, "slpAmountRecorded should be 0");
        assert.equal(totalSLPAmountRecordedBefore, 0, "totalSLPAmountRecorded should be 0");
        assert.equal(finishedONERecordedBefore, 0, "totalSLPAmountRecorded should be 0");
        assert.equal(finishedSUSHIRecordedBefore, 0), "finishedSUSHIRecorded should be 0";

        await powerBomb.connect(a1).deposit(usdc.address, Amount);

        var usdcBalanceAfter = await usdc.balanceOf(a1.address);
        var slpAmountRecordedAfter = (await powerBomb.userInfo(a1.address))["slpAmount"];
        var finishedONERecordedAfter = (await powerBomb.userInfo(a1.address))["finishedONE"];
        var finishedSUSHIRecordedAfter = (await powerBomb.userInfo(a1.address))["finishedSUSHI"];
        var totalSLPAmountRecordedAfter = await powerBomb.totalSLPAmount();

        assert.equal(parseInt(usdcBalanceBefore), parseInt(usdcBalanceAfter.add(Amount)), "USDC balance disagreement");
        expect(parseInt(slpAmountRecordedAfter)).greaterThan(0);
        expect(parseInt(totalSLPAmountRecordedAfter)).greaterThan(0);
        assert.equal(parseInt(slpAmountRecordedAfter), parseInt(totalSLPAmountRecordedAfter), "slpAmountRecordedAfter and totalSLPAmountRecordedAfter should be the same");
        assert.equal(finishedONERecordedAfter, 0, "finishedONERecordedAfter should be 0");
        assert.equal(finishedSUSHIRecordedAfter, 0), "finishedSUSHIRecorded should be 0";

        var [slpAmount, rewardDebt] = await sushiSwapChef.userInfo(await powerBomb.pid(), powerBomb.address);
        expect(parseInt(slpAmount)).greaterThan(0);
        expect(parseInt(rewardDebt)).greaterThan(0);
      });


      it('Should succeed to harvest as expected', async () => {
        await increaseTime(3600 * 24);

        var ethBalanceOfPowerBombBefore = await eth.balanceOf(powerBomb.address);
        var ethBalanceOfUserBefore = await eth.balanceOf(a1.address);
        var totalPendingONESoldBefore = await powerBomb.totalPendingONESold();
        var totalPendingSUSHISoldBefore = await powerBomb.totalPendingSUSHISold();
        var totalPendingTokenFromONEBefore = await powerBomb.totalPendingTokenFromONE();
        var finishedONERecordedBefore = (await powerBomb.userInfo(a1.address))["finishedONE"];
        var finishedSUSHIRecordedBefore = (await powerBomb.userInfo(a1.address))["finishedSUSHI"];

        await powerBomb.connect(a1).harvest();

        var ethBalanceOfPowerBombAfter = await eth.balanceOf(powerBomb.address);
        var ethBalanceOfUserAfter = await eth.balanceOf(a1.address);
        var totalPendingONESoldAfter = await powerBomb.totalPendingONESold();
        var totalPendingSUSHISoldAfter = await powerBomb.totalPendingSUSHISold();
        var totalPendingTokenFromONEAfter = await powerBomb.totalPendingTokenFromONE();
        var finishedONERecordedAfter = (await powerBomb.userInfo(a1.address))["finishedONE"];
        var finishedSUSHIRecordedAfter = (await powerBomb.userInfo(a1.address))["finishedSUSHI"];

        assert.equal(ethBalanceOfPowerBombBefore - ethBalanceOfPowerBombAfter, ethBalanceOfUserAfter - ethBalanceOfUserBefore, "ethBalanceOfPowerBomb delta should be the same as ethBalanceOfUser delta");
        assert.equal(finishedONERecordedAfter - finishedONERecordedBefore, totalPendingONESoldBefore - totalPendingONESoldAfter, "finishedONERecorded delta should be the same as totalPendingONESold delta");
        assert.equal(finishedSUSHIRecordedAfter - finishedSUSHIRecordedBefore, totalPendingSUSHISoldBefore - totalPendingSUSHISoldAfter, "finishedSUSHIRecorded delta should be the same as totalPendingSUSHISold delta");
    });


      it('Should succeed to sell farmed rewards as expected', async () => {
        await increaseTime(3600 * 24);

        var ethBalanceOfPowerBombBefore = await eth.balanceOf(powerBomb.address);
        var ethBalanceOfWalletBefore = await eth.balanceOf(owner.address);
        var oneBalanceOfPowerBombBefore = await one.balanceOf(powerBomb.address);
        var sushiBalanceOfPowerBombBefore = await sushi.balanceOf(powerBomb.address);
        var totalPendingONESoldBefore = await powerBomb.totalPendingONESold();
        var totalPendingSUSHISoldBefore = await powerBomb.totalPendingSUSHISold();
        var totalBoughtTokenBefore = await powerBomb.totalBoughtToken();
        var totalPendingTokenFromONEBefore = await powerBomb.totalPendingTokenFromONE();

        assert.equal(ethBalanceOfPowerBombBefore, 0, "eth balance of PowerBomb should be 0");
        assert.equal(totalPendingONESoldBefore, 0, "totalPendingONESold should be 0");
        assert.equal(totalPendingSUSHISoldBefore, 0, "totalPendingSUSHISold should be 0");
        assert.equal(totalBoughtTokenBefore, 0, "totalBoughtToken should be 0");
        assert.equal(totalPendingTokenFromONEBefore, 0, "totalPendingTokenFromONE should be 0");        
        expect(parseInt(oneBalanceOfPowerBombBefore)).greaterThan(0);
        expect(parseInt(sushiBalanceOfPowerBombBefore)).greaterThan(0);

        await powerBomb.connect(owner).sellRewards();

        var ethBalanceOfPowerBombAfter = await eth.balanceOf(powerBomb.address);
        var ethBalanceOfWalletAfter = await eth.balanceOf(owner.address);
        var totalPendingONESoldAfter = await powerBomb.totalPendingONESold();
        var totalPendingSUSHISoldAfter = await powerBomb.totalPendingSUSHISold();
        var totalBoughtTokenAfter = await powerBomb.totalBoughtToken();
        var totalPendingTokenFromONEAfter = await powerBomb.totalPendingTokenFromONE();
        var oneBalanceOfPowerBombAfter = await one.balanceOf(powerBomb.address);
        var sushiBalanceOfPowerBombAfter = await sushi.balanceOf(powerBomb.address);

        expect(parseInt(ethBalanceOfPowerBombAfter)).greaterThan(0);
        assert.equal((totalBoughtTokenAfter * 0.95).toFixed(0), parseInt(ethBalanceOfPowerBombAfter), "ethBalanceOfPowerBomb should be the 95% of totalBoughtToken");
        assert.equal(ethBalanceOfWalletAfter - ethBalanceOfWalletBefore, parseInt((ethBalanceOfPowerBombAfter / 0.95) * 0.05), "ethBalanceOfWallet delta disagreement");
        assert.equal(totalBoughtTokenAfter - totalBoughtTokenBefore, parseInt(ethBalanceOfPowerBombAfter / 0.95), "totalBoughtToken delta disagreement");
        assert.equal(parseInt(totalPendingONESoldAfter), parseInt(oneBalanceOfPowerBombBefore), "totalPendingONESoldAfter should be the same as oneBalanceOfPowerBombBefore");
        assert.equal(parseInt(totalPendingSUSHISoldAfter), parseInt(sushiBalanceOfPowerBombBefore), "totalPendingSUSHISoldAfter should be the same as sushiBalanceOfPowerBombBefore");
        assert.equal(oneBalanceOfPowerBombAfter, 0, "oneBalanceOfPowerBombAfter should be 0");
        assert.equal(sushiBalanceOfPowerBombAfter, 0, "sushiBalanceOfPowerBombAfter should be 0");

        await expectRevert(powerBomb.connect(a1).sellRewards(), "Ownable: caller is not the owner");
        });


        it('Should succeed to withdraw as expected', async () => {
            await increaseTime(3600 * 24);

            var usdcBalanceOfUserBefore = await usdc.balanceOf(a1.address);
            var usdcBalanceOfWalletBefore = await usdc.balanceOf(owner.address);
            var [slpAmountOfPowerBombBefore, ] = await sushiSwapChef.userInfo(await powerBomb.pid(), powerBomb.address);
            var slpAmountRecordedBefore = (await powerBomb.userInfo(a1.address))["slpAmount"];
            var finishedONERecordedBefore = (await powerBomb.userInfo(a1.address))["finishedONE"];
            var finishedSUSHIRecordedBefore = (await powerBomb.userInfo(a1.address))["finishedSUSHI"];
            var totalSLPAmountBefore = await powerBomb.totalSLPAmount();

            await powerBomb.connect(a1).withdraw(usdc.address, slpAmountRecordedBefore);

            var usdcBalanceOfUserAfter = await usdc.balanceOf(a1.address);
            var usdcBalanceOfWalletAfter = await usdc.balanceOf(owner.address);
            var [slpAmountOfPowerBombAfter, ] = await sushiSwapChef.userInfo(await powerBomb.pid(), powerBomb.address);
            var slpAmountRecordedAfter = (await powerBomb.userInfo(a1.address))["slpAmount"];
            var finishedONERecordedAfter = (await powerBomb.userInfo(a1.address))["finishedONE"];
            var finishedSUSHIRecordedAfter = (await powerBomb.userInfo(a1.address))["finishedSUSHI"];
            var totalSLPAmountAfter = await powerBomb.totalSLPAmount();

            assert.equal(parseInt(slpAmountRecordedBefore - slpAmountRecordedAfter), parseInt(slpAmountRecordedBefore), "slpAmountRecorded delta should be the same as specified withdraw amount");
            assert.equal(parseInt(totalSLPAmountBefore - totalSLPAmountAfter), parseInt(slpAmountRecordedBefore), "totalSLPAmount delta should be the same as specified withdraw amount");
            assert.equal(parseInt(slpAmountOfPowerBombBefore - slpAmountOfPowerBombAfter), parseInt(slpAmountRecordedBefore), "slpAmountOfPowerBomb delta should be the same as specified withdraw amount");
            expect(parseInt(usdcBalanceOfUserAfter - usdcBalanceOfUserBefore)).greaterThan(0);
            expect(parseInt(usdcBalanceOfWalletAfter - usdcBalanceOfWalletBefore)).greaterThan(0);
        });
    });
  });