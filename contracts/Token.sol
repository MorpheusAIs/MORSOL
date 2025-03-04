// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {OFTCore} from "@layerzerolabs/oft-evm/contracts/OFTCore.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Token is OFTCore, ERC20, ERC20Burnable, ERC20Permit, ERC20Votes {
    mapping(address => bool) public isMinter;
    address public minter;

    event NewMinter(address indexed newMinter);

    error InvalidMinterZeroAddress();
    error CallerNotMinter(address caller);

    uint256 public constant MAX_SUPPLY = 10_000_000_000e18;

    modifier onlyMinter() {
        if (!isMinter[_msgSender()]) {
            revert CallerNotMinter(msg.sender);
        }
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    )
        ERC20(_name, _symbol)
        ERC20Permit(_name)
        OFTCore(decimals(), _lzEndpoint, _delegate)
        Ownable(_delegate)
    {
        minter = _delegate;
        isMinter[minter] = true;
    }
    /**
     * @notice Allows the minter to create new tokens
     *
     * @param _account The address that will receive the minted tokens
     * @param _amount The amount of tokens to mint
     */
    function mint(address _account, uint256 _amount) external onlyMinter {
        _mint(_account, _amount);
    }

    /**
     * @notice Allows the contract owner to set a new minter
     * @param newMinter The address of the new minter
     */
    function setMinter(address newMinter) external onlyOwner {
        isMinter[newMinter] = true;
        emit NewMinter(newMinter);
    }
    /**
     * @notice Allows the contract owner to remove a minter
     * @param prevMinter The address of the minter to remove
     */
    function deleteMinter(address prevMinter) external onlyOwner {
        isMinter[prevMinter] = false;
    }
    /**
     * @dev Override function to define the maximum token supply
     */
    function _maxSupply() internal pure override returns (uint256) {
        return MAX_SUPPLY;
    }
    /**
     * @notice Retrieves the nonce for a given address
     */
    function nonces(
        address _owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return Nonces.nonces(_owner);
    }
    /**
     * @dev Handles token balance updates when transferring tokens
     */
    function _update(
        address _from,
        address _to,
        uint256 _value
    ) internal virtual override(ERC20, ERC20Votes) {
        return ERC20Votes._update(_from, _to, _value);
    }
    /**
     * @notice Retrieves the address of the underlying ERC20 implementation
     */
    function token() public view returns (address) {
        return address(this);
    }
    /**
     * @notice Determines whether approval is needed for token transfers
     */
    function approvalRequired() external pure virtual returns (bool) {
        return false;
    }
    /**
     * @dev Burns tokens from the sender's balance before transferring them cross-chain
     */
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    )
        internal
        virtual
        override
        returns (uint256 amountSentLD, uint256 amountReceivedLD)
    {
        (amountSentLD, amountReceivedLD) = _debitView(
            _amountLD,
            _minAmountLD,
            _dstEid
        );
        _burn(_from, amountSentLD);
    }
    /**
     * @dev Mints tokens to the recipient's balance when receiving tokens cross-chain
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 /*_srcEid*/
    ) internal virtual override returns (uint256 amountReceivedLD) {
        if (_to == address(0x0)) {
            _to = address(0xdead);
        }
        _mint(_to, _amountLD);
        return _amountLD;
    }
}
