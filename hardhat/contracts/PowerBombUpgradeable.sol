// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import "./interfaces/ISushiSwapV2Router02.sol";
import "./interfaces/IRewarder.sol";
import "./interfaces/ISushiSwapV2MiniChef.sol";

contract PowerBombUpgradeable is OwnableUpgradeable {
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public usdt1;
    address public usdc1;
    address public slp;
    address public one;
    address public sushi;
    address public rewardToken;

    uint256 public totalSLPAmount;
    uint256 public totalFarmedONE;
    uint256 public totalFarmedSUSHI;

    uint256 public totalPendingONESold;
    uint256 public totalPendingSUSHISold;

    uint256 public totalBoughtToken;
    uint256 public totalPendingTokenFromONE;

    struct UserInfo {
        // SLP token amount that user provided
        uint256 slpAmount;
        // Finished distributed rewards to user
        uint256 finishedONE;
        uint256 finishedSUSHI;
    }
    mapping (address => UserInfo) public userInfo;

    uint256 public lastTime;
    // Accumulated rewards per SLP
    uint256 public accONEPerSLP;
    uint256 public accSUSHIPerSLP;

    uint256 public constant pid = 6;
    ISushiSwapV2Router02 public sushiSwapRouter;
    ISushiSwapV2MiniChef public sushiSwapChef;
    IRewarder public rewarder;

    // Address to collect fees
    uint256 private constant DENOMINATOR = 10000;
    uint256 public profitSharingFeePerc;
    address public treasuryWallet;

    event SetProfitSharingFeePerc(uint256 indexed oldProfileSharingFeePerc, uint256 indexed newProfileSharingFeePerc);
    event SetTreasuryWallet(address indexed treasuryWallet);
    event Update(uint256 oneAmount, uint256 sushiAmount);
    event Deposit(address indexed tokenDeposit, uint256 tokenAmount, uint256 slpAmount);
    event Withdraw(address indexed tokenWithdraw, uint256 slpAmount, uint256 tokenAmount);
    event Sold(uint256 oneAmount, uint256 sushiAmount, uint256 boughtAmount);
    event Harvest(uint256 amount);

    function initialize(
        address _usdt1, address _usdc1, address _slp, 
        address _one, address _sushi, address _rewardToken,
        address _sushiSwapRouter, address _sushiSwapChef
    ) public initializer {
        require(_usdt1 != address(0), "usdt1 is invalid");
        require(_usdc1 != address(0), "usdc1 is invalid");
        require(_slp != address(0), "slp is invalid");
        require(_one != address(0), "one is invalid");
        require(_sushi != address(0), "sushi is invalid");
        require(_rewardToken != address(0), "rewardToken is invalid");
        require(_sushiSwapRouter != address(0), "sushiSwapRouter is invalid");
        require(_sushiSwapChef != address(0), "sushiSwapChef is invalid");
        __Ownable_init();

        usdt1 = _usdt1;
        usdc1 = _usdc1;
        slp = _slp;
        one = _one;
        sushi = _sushi;
        rewardToken = _rewardToken;
        sushiSwapRouter = ISushiSwapV2Router02(_sushiSwapRouter);
        sushiSwapChef = ISushiSwapV2MiniChef(_sushiSwapChef);

        rewarder = sushiSwapChef.rewarder(pid);
        profitSharingFeePerc = 500; // 5%


        IERC20Upgradeable(usdt1).approve(address(sushiSwapRouter), type(uint256).max);
        IERC20Upgradeable(usdc1).approve(address(sushiSwapRouter), type(uint256).max);
        IERC20Upgradeable(one).approve(address(sushiSwapRouter), type(uint256).max);
        IERC20Upgradeable(sushi).approve(address(sushiSwapRouter), type(uint256).max);
        IERC20Upgradeable(rewardToken).approve(address(sushiSwapRouter), type(uint256).max);
        IERC20Upgradeable(slp).approve(address(sushiSwapRouter), type(uint256).max);
        IERC20Upgradeable(slp).approve(address(sushiSwapChef), type(uint256).max);
    }

    /// @notice Function to set new profit sharing fee percentage
    /// @param _percentage Percentage of new profit sharing fee
    function setProfitSharingFeePerc(uint256 _percentage) external onlyOwner {
        uint256 oldProfitSharingFeePerc = profitSharingFeePerc;
        profitSharingFeePerc = _percentage;
        emit SetProfitSharingFeePerc(oldProfitSharingFeePerc, _percentage);
    }

    /// @notice Function to set new treasury wallet address
    /// @param _treasuryWallet Address of new treasury wallet
    function setTreasuryWallet(address _treasuryWallet) external onlyOwner {
        treasuryWallet = _treasuryWallet;
        emit SetTreasuryWallet(_treasuryWallet);
    }

    function update() public returns(uint256, uint256, uint256) {
        if (lastTime < block.timestamp && 0 < totalSLPAmount) {
            (address[] memory _tokens, uint256[] memory _amounts) = rewarder.pendingTokens(pid, address(this), 0);
            require(one == _tokens[0], "update: wrong farmed rewarded token, not ONE");

            uint256 pendingONE = _amounts[0];
            accONEPerSLP = accONEPerSLP.add(pendingONE.div(totalSLPAmount));
            totalFarmedONE = totalFarmedONE.add(pendingONE);

            uint256 pendingSUSHI = sushiSwapChef.pendingSushi(pid, address(this));
            accSUSHIPerSLP = accSUSHIPerSLP.add(pendingSUSHI.div(totalSLPAmount));
            totalFarmedSUSHI = totalFarmedSUSHI.add(pendingSUSHI);

            lastTime = block.timestamp;

            sushiSwapChef.harvest(pid, address(this));
            emit Update(pendingONE, pendingSUSHI);

            return (lastTime, accSUSHIPerSLP, accONEPerSLP);
        }
        return (0,0,0);
    }

    /**
     * @dev Deposit
     *
     * @param _token        Input token. One of usdt1, usdc1, and slp
     * @param _amount       Amount of input token
     */
    function deposit(address _token, uint256 _amount) external {
        require(usdt1 == _token || usdc1 == _token || slp == _token, "deposit: invalid token");
        require(0 < _amount, "deposit: invalid amount");

        IERC20Upgradeable(_token).safeTransferFrom(msg.sender, address(this), _amount);

        update();
        UserInfo storage user = userInfo[msg.sender];
        uint256 slpAmount;

        if (usdt1 == _token) {
            uint256 usdcAmount = _swap(usdt1, usdc1, _amount.div(2));
            (, , slpAmount) = sushiSwapRouter.addLiquidity(usdt1, usdc1, _amount.div(2), usdcAmount, 0, 0, address(this), block.timestamp);
        } else if (usdc1 == _token) {
            uint256 usdtAmount = _swap(usdc1, usdt1, _amount.div(2));
            (, , slpAmount) = sushiSwapRouter.addLiquidity(usdc1, usdt1, _amount.div(2), usdtAmount, 0, 0, address(this), block.timestamp);
        } else {
            // slp == _token
            slpAmount = _amount;
        }

        user.slpAmount = user.slpAmount.add(slpAmount);
        totalSLPAmount = totalSLPAmount.add(slpAmount);
        user.finishedONE = user.finishedONE.add(accONEPerSLP.mul(slpAmount));
        user.finishedSUSHI = user.finishedSUSHI.add(accSUSHIPerSLP.mul(slpAmount));

        sushiSwapChef.deposit(pid, slpAmount, address(this));
        emit Deposit(_token, _amount, slpAmount);
    }

    function _swap(address _inToken, address _outToken, uint256 _inAmount) internal returns (uint256 _outAmount) {
        address[] memory path = new address[](2);
        path[0] = _inToken;
        path[1] = _outToken;
        uint256[] memory amounts = sushiSwapRouter.swapExactTokensForTokens(_inAmount, 0, path, address(this), block.timestamp);
        _outAmount = amounts[1];
    }

    /**
     * @dev Withdraw
     *
     * @param _token        Input token. One of usdt1, usdc1, and slp
     * @param _amount       Amount of slp token
     */
    function withdraw(address _token, uint256 _amount) external {
        require(usdt1 == _token || usdc1 == _token || slp == _token, "withdraw: invalid token");
        UserInfo storage user = userInfo[msg.sender];
        require(0 < _amount && _amount <= user.slpAmount, "withdraw: invalid amount");

        harvest();

        uint256 accumulatedONE = user.slpAmount.mul(accONEPerSLP);
        uint256 pendingONE = accumulatedONE.sub(user.finishedONE).mul(_amount).div(user.slpAmount);
        uint256 accumulatedSUSHI = user.slpAmount.mul(accSUSHIPerSLP);
        uint256 pendingSUSHI = accumulatedSUSHI.sub(user.finishedSUSHI).mul(_amount).div(user.slpAmount);
        uint256 withdrawAmount;
        uint256 harvestAmount;
        uint256 harvestFee;

        uint256 removed = accONEPerSLP.mul(_amount);
        if (removed <= user.finishedONE) {
            user.finishedONE = user.finishedONE.sub(removed);
        } else {
            pendingONE = pendingONE.add(removed.sub(user.finishedONE));
            user.finishedONE = 0;
        }
        if (0 < pendingONE) {
            if (_amount < user.slpAmount && pendingONE < user.finishedONE) {
                // We leave the pending ONE, so that it can havest next time
                user.finishedONE = user.finishedONE.sub(pendingONE);
            } else {
                // We transfer the pending ONE to user
                uint256 oneBalance = IERC20Upgradeable(one).balanceOf(address(this));
                if (oneBalance < pendingONE) {
                    pendingONE = oneBalance;
                }
                if (slp == _token) {
                    uint256 usdtAmount = _swap(one, usdt1, pendingONE.div(2));
                    uint256 usdcAmount = _swap(one, usdc1, pendingONE.div(2));
                    (, , uint256 slpAmount) = sushiSwapRouter.addLiquidity(usdt1, usdc1, usdtAmount, usdcAmount, 0, 0, address(this), block.timestamp);
                    harvestAmount = slpAmount;
                } else {
                    harvestAmount = _swap(one, _token, pendingONE);
                }
            }
        }

        removed = accSUSHIPerSLP.mul(_amount);
        if (removed <= user.finishedSUSHI) {
            user.finishedSUSHI = user.finishedSUSHI.sub(removed);
        } else {
            pendingSUSHI = pendingSUSHI.add(removed.sub(user.finishedSUSHI));
            user.finishedSUSHI = 0;
        }
        if (0 < pendingSUSHI) {
            if (_amount < user.slpAmount && pendingSUSHI < user.finishedSUSHI) {
                // We leave the pending SUSHI, so that it can havest next time
                user.finishedSUSHI = user.finishedSUSHI.sub(pendingSUSHI);
            } else {
                // We transfer the pending SUSHI to user
                uint256 sushiBalance = IERC20Upgradeable(sushi).balanceOf(address(this));
                if (sushiBalance < pendingSUSHI) {
                    pendingSUSHI = sushiBalance;
                }
                if (slp == _token) {
                    uint256 usdtAmount = _swap(sushi, usdt1, pendingSUSHI.div(2));
                    uint256 usdcAmount = _swap(sushi, usdc1, pendingSUSHI.div(2));
                    (, , uint256 slpAmount) = sushiSwapRouter.addLiquidity(usdt1, usdc1, usdtAmount, usdcAmount, 0, 0, address(this), block.timestamp);
                    harvestAmount = harvestAmount.add(slpAmount);
                } else {
                    harvestAmount = harvestAmount.add(_swap(sushi, _token, pendingSUSHI));
                }
            }
        }

        if (0 < harvestAmount) {
            harvestFee =  harvestAmount.mul(profitSharingFeePerc).div(DENOMINATOR);
            harvestAmount = harvestAmount.sub(harvestFee);
        }

        user.slpAmount = user.slpAmount.sub(_amount);
        totalSLPAmount = totalSLPAmount.sub(_amount);

        sushiSwapChef.withdraw(pid, _amount, address(this));

        if (usdt1 == _token) {
            (uint256 usdt1Amount, uint256 usdc1Amount) = sushiSwapRouter.removeLiquidity(usdt1, usdc1, _amount, 0, 0, address(this), block.timestamp);
            uint256 amount = _swap(usdc1, usdt1, usdc1Amount);
            withdrawAmount = usdt1Amount.add(amount);
        } else if (usdc1 == _token) {
            (uint256 usdc1Amount, uint256 usdt1Amount) = sushiSwapRouter.removeLiquidity(usdc1, usdt1, _amount, 0, 0, address(this), block.timestamp);
            uint256 amount = _swap(usdt1, usdc1, usdt1Amount);
            withdrawAmount = usdc1Amount.add(amount);
        } else {
            // slp == _token
            withdrawAmount = _amount;
        }

        uint256 withdrawFee = withdrawAmount.mul(10).div(DENOMINATOR);
        withdrawAmount = withdrawAmount.sub(withdrawFee);
        IERC20Upgradeable(_token).safeTransfer(treasuryWallet, withdrawFee.add(harvestFee));
        IERC20Upgradeable(_token).safeTransfer(msg.sender, withdrawAmount.add(harvestAmount));
        emit Withdraw(_token, _amount, withdrawAmount.add(harvestAmount));
    }

    function sellRewards() external onlyOwner {
        uint256 oneBalance = IERC20Upgradeable(one).balanceOf(address(this));
        uint256 sushiBalance = IERC20Upgradeable(sushi).balanceOf(address(this));

        uint256 amountFromONE = _swap(one, rewardToken, oneBalance);
        totalBoughtToken = totalBoughtToken.add(amountFromONE);
        uint256 harvestFee =  amountFromONE.mul(profitSharingFeePerc).div(DENOMINATOR);
        totalPendingTokenFromONE = totalPendingTokenFromONE.add(amountFromONE).sub(harvestFee);

        uint256 amountFromSUSHI = _swap(sushi, rewardToken, sushiBalance);
        totalBoughtToken = totalBoughtToken.add(amountFromSUSHI);
        harvestFee = harvestFee.add(amountFromSUSHI.mul(profitSharingFeePerc).div(DENOMINATOR));

        totalPendingONESold = totalPendingONESold.add(oneBalance);
        totalPendingSUSHISold = totalPendingSUSHISold.add(sushiBalance);

        IERC20Upgradeable(rewardToken).safeTransfer(treasuryWallet, harvestFee);
        emit Sold(oneBalance, sushiBalance, amountFromONE.add(amountFromSUSHI));
    } 

    function harvest() public {
        update();
        UserInfo storage user = userInfo[msg.sender];

        uint256 accumulatedONE = user.slpAmount.mul(accONEPerSLP);
        uint256 pendingONE = accumulatedONE.sub(user.finishedONE);
        if (totalPendingONESold < pendingONE) {
            pendingONE = totalPendingONESold;
        }

        uint256 accumulatedSUSHI = user.slpAmount.mul(accSUSHIPerSLP);
        uint256 pendingSUSHI = accumulatedSUSHI.sub(user.finishedSUSHI);
        if (totalPendingSUSHISold < pendingSUSHI) {
            pendingSUSHI = totalPendingSUSHISold;
        }

        uint256 tokenBalance = IERC20Upgradeable(rewardToken).balanceOf(address(this));
        if (tokenBalance < totalPendingTokenFromONE) {
            totalPendingTokenFromONE = tokenBalance;
        }
        uint256 totalPendingTokenFromSUSHI = tokenBalance.sub(totalPendingTokenFromONE);

        uint256 pendingAmountFromONE = (0 < totalPendingONESold) ? totalPendingTokenFromONE.mul(pendingONE).div(totalPendingONESold) : 0;
        uint256 pendingAmountFromSUSHI = (0 < totalPendingSUSHISold) ? totalPendingTokenFromSUSHI.mul(pendingSUSHI).div(totalPendingSUSHISold) : 0;
        uint256 pendingAmount = pendingAmountFromONE.add(pendingAmountFromSUSHI);

        totalPendingONESold = totalPendingONESold.sub(pendingONE);
        totalPendingSUSHISold = totalPendingSUSHISold.sub(pendingSUSHI);
        totalPendingTokenFromONE = totalPendingTokenFromONE.sub(pendingAmountFromONE);

        user.finishedONE = user.finishedONE.add(pendingONE);
        user.finishedSUSHI = user.finishedSUSHI.add(pendingSUSHI);

        if (0 < pendingAmount) {
            IERC20Upgradeable(rewardToken).safeTransfer(msg.sender, pendingAmount);
        }
        emit Harvest(pendingAmount);
    }

    uint256[28] private __gap;
}