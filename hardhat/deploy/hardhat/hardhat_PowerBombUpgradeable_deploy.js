const { ethers, network } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
    await network.provider.request({method: "hardhat_impersonateAccount", params: [process.env.IMPERSONATED_ACCOUNT]});
};

module.exports.tags = ["hardhat_PowerBombUpgradeable_deploy"];
module.exports.dependencies = [
  "hardhat_reset",
  "mainnet_PowerBombUpgradeable_deploy",
];
