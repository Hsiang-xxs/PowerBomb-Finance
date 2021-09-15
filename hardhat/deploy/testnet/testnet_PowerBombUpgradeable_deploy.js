const { ethers } = require("hardhat");
const { testnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  console.log("Now deploying PowerBombUpgradeable on Testnet...");
  const impl = await deploy("PowerBombUpgradeable", {
    from: deployer.address,
  });
  console.log("PowerBombUpgradeable implementation address: ", impl.address);

  const implArtifact = await deployments.getArtifact("PowerBombUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));

  console.log("Now deploying PowerBombUpgradeableProxy for BTC on Testnet...");
  var data = iface.encodeFunctionData("initialize", [
    network_.PowerBomb.usdt,
    network_.PowerBomb.usdc,
    network_.PowerBomb.slp,
    network_.PowerBomb.one,
    network_.PowerBomb.sushi,
    network_.PowerBomb.btc,
    network_.PowerBomb.sushiSwapRouter,
    network_.PowerBomb.sushiSwapChef
  ]);

  const proxyForBTC = await deploy("PowerBombUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
  });
  console.log("PowerBombUpgradeableProxy for BTC proxy address: ", proxyForBTC.address);

  console.log("Now deploying PowerBombUpgradeableProxy for ETH on Testnet...");
  data = iface.encodeFunctionData("initialize", [
    network_.PowerBomb.usdt,
    network_.PowerBomb.usdc,
    network_.PowerBomb.slp,
    network_.PowerBomb.one,
    network_.PowerBomb.sushi,
    network_.PowerBomb.eth,
    network_.PowerBomb.sushiSwapRouter,
    network_.PowerBomb.sushiSwapChef
  ]);

  const proxyForETH = await deploy("PowerBombUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
  });
  console.log("PowerBombUpgradeableProxy for ETH proxy address: ", proxyForETH.address);
};
module.exports.tags = ["testnet_PowerBombUpgradeable_deploy"];
