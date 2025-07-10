// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.13;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {OFTCore} from "@layerzerolabs/oft-evm/contracts/OFTCore.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MORTOKEN_REVISED is
    OFTCore,
    ERC20,
    ERC20Burnable,
    ERC20Permit,
    ERC20Votes
{
    mapping(address => bool) public isMinter;

    address public minter;
    event NewMinter(address newMinter);
    error InvalidMinterZeroAddress();
    error CallerNotMinter(address caller);

    modifier onlyMinter() {
        if (!isMinter[_msgSender()]) {
            revert CallerNotMinter(msg.sender);
        }
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        // address _minter,
        // address _owner,
        address _lzEndpoint,
        address _delegate
    )
        ERC20Permit(_name)
        ERC20(_name, _symbol)
        OFTCore(18, _lzEndpoint, _delegate)
        Ownable(_delegate)
    {
        minter = _delegate;
        isMinter[minter] = true;
    }

    function mint(address _account, uint256 _amount) external onlyMinter {
        _mint(_account, _amount);
    }

    function setMinter(address newMinter) external onlyOwner {
        isMinter[newMinter] = true;
    }

    function deleteMinter(address prevMinter) external onlyOwner {
        isMinter[prevMinter] = false;
    }

    function nonces(
        address _owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return Nonces.nonces(_owner);
    }

    function _update(
        address _from,
        address _to,
        uint256 _value
    ) internal virtual override(ERC20, ERC20Votes) {
        return ERC20Votes._update(_from, _to, _value);
    }

    /**
     * @dev Retrieves the address of the underlying ERC20 implementation.
     * @return The address of the OFT token.
     *
     * @dev In the case of OFT, address(this) and erc20 are the same contract.
     */
    function token() public view returns (address) {
        return address(this);
    }

    /**
     * @notice Indicates whether the OFT contract requires approval of the 'token()' to send.
     * @return requiresApproval Needs approval of the underlying token implementation.
     *
     * @dev In the case of OFT where the contract IS the token, approval is NOT required.
     */
    function approvalRequired() external pure virtual returns (bool) {
        return false;
    }

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

        // @dev In NON-default OFT, amountSentLD could be 100, with a 10% fee, the amountReceivedLD amount is 90,
        // therefore amountSentLD CAN differ from amountReceivedLD.

        // @dev Default OFT burns on src.
        _burn(_from, amountSentLD);
    }

    /**
     * @dev Credits tokens to the specified address.
     * @param _to The address to credit the tokens to.
     * @param _amountLD The amount of tokens to credit in local decimals.
     * @dev _srcEid The source chain ID.
     * @return amountReceivedLD The amount of tokens ACTUALLY received in local decimals.
     */

    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 /*_srcEid*/
    ) internal virtual override returns (uint256 amountReceivedLD) {
        if (_to == address(0x0)) _to = address(0xdead); // _mint(...) does not support address(0x0)
        // @dev Default OFT mints on dst.
        _mint(_to, _amountLD);
        // @dev In the case of NON-default OFT, the _amountLD MIGHT not be == amountReceivedLD.
        return _amountLD;
    }
}
