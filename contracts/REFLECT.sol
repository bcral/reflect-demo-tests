// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract DEMO is IERC20, Ownable {

    mapping(address => bool) private _isExcludedFromFee;
    mapping(address => bool) private _isExcludedFromReward;
    mapping(address => uint256) private _balances;
    mapping(address => uint256) private _lastDividendPoints;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private constant pointMultiplier = 10**18;
    uint256 private _totalSupply;
    uint256 private _totalDividendPoints;
    uint256 private _unclaimedDividends;
    uint256 private _excludedFromRewardSupply;

    string private _name = "Demo";
    string private _symbol = "DEMO";

    constructor() {
        _mint(msg.sender, 1000 * 10**18);
        _isExcludedFromFee[owner()] = true;
        _isExcludedFromReward[address(0)] = true;
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account] + _dividendsOwing(account);
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }

        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        uint256 currentAllowance = _allowances[_msgSender()][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(_msgSender(), spender, currentAllowance - subtractedValue);
        }

        return true;
    }

    function mint(address account, uint256 amount) external onlyOwner() {
        _mint(account, amount);
    }

    function blackList(address account) external onlyOwner() {
        require(!_isExcludedFromReward[account], "VIRAL: Account already excluded");
        _updateAccount(account);
        _isExcludedFromReward[account] = true;
        _excludedFromRewardSupply += _balances[account];
    }

    function unBlackList(address account) external onlyOwner() {
        require(_isExcludedFromReward[account], "VIRAL: Account not excluded");
        _updateAccount(account);
        _isExcludedFromReward[account] = false;
        _excludedFromRewardSupply -= _balances[account];
    }

    function excludeFromFee(address account) external onlyOwner() {
        require(!_isExcludedFromFee[account], "VIRAL: Account already excluded");
        _isExcludedFromFee[account] = true;
    }

    function includeInFee(address account) external onlyOwner() {
        require(_isExcludedFromFee[account], "VIRAL: Account not excluded");
        _isExcludedFromFee[account] = false;
    }

    function _disburse(uint256 rAmount) private {
        _totalDividendPoints += (rAmount * pointMultiplier / (_totalSupply - _excludedFromRewardSupply));
        _unclaimedDividends += rAmount;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        
        uint256 reflectionFee;
        uint256 rAmount;
        uint256 gAmount = amount;
        if (!_isExcludedFromFee[sender]) {
            reflectionFee = 5;
            rAmount = amount * reflectionFee / 100;
            gAmount = amount - rAmount;
        }

        unchecked {
            _balances[sender] = senderBalance - amount;
        }
        _balances[recipient] += gAmount;
        _disburse(rAmount);

        if (_isExcludedFromReward[sender]) {
            _excludedFromRewardSupply -= amount;
        }
        if (_isExcludedFromReward[recipient]) {
            _excludedFromRewardSupply += gAmount;
        }

        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _dividendsOwing(address account) internal view returns (uint256) {
        if (_isExcludedFromReward[account]) {
            return 0;
        }
        uint256 newDividendPoints = _totalDividendPoints - _lastDividendPoints[account];
        return (_balances[account] * newDividendPoints) / pointMultiplier;
    }

    function _updateAccount(address account) internal {
        uint256 owing = _dividendsOwing(account);
        if (owing > 0) {
            _unclaimedDividends -= owing;
            _balances[account] += owing;
        } 
        _lastDividendPoints[account] = _totalDividendPoints;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
        _updateAccount(from);
        _updateAccount(to);
    }
}
