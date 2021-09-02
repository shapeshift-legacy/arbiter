pragma solidity 0.4.24;

import "./ERC20Interface.sol";
import "./Logger.sol";
/**
 * Contract that will forward any incoming Ether to the creator of the contract
 */
contract Forwarder {
  // Address to which any funds sent to this contract will be forwarded
  address public parentAddress;

  /* The central logger contract. */
  Logger public logger;

  /**
   * Create the contract, and sets the destination address to that of the creator
   */
  bool initialized;
  modifier once { if (initialized) revert(); _; }

  function initialize(address _logger) public once {
    parentAddress = msg.sender;
    initialized = true;
    logger = Logger(_logger);
  }
  /**
   * Modifier that will execute internal code block only if the sender is the parent address
   */
  modifier onlyParent {
    if (msg.sender != parentAddress) {
      revert();
    }
    _;
  }
  /**
   * Default function; Gets called when Ether is deposited, and forwards it to the parent address
   */
  function() external payable {
    // throws on failure
    require(msg.data.length == 0);
    if (!parentAddress.call.value(msg.value)()) revert();
    logger.logForwarderDeposited(msg.sender, msg.value, msg.data);
  }
  /**
   * Execute a token transfer of the full balance from the forwarder token to the parent address
   * @param tokenContractAddress the address of the erc20 token contract
   */
  function flushTokens(address tokenContractAddress) public onlyParent {
    ERC20Interface instance = ERC20Interface(tokenContractAddress);
    address forwarderAddress = address(this);
    uint256 forwarderBalance = instance.balanceOf(forwarderAddress);

    if (forwarderBalance == 0) {
      return;
    }
    if (!instance.transfer(parentAddress, forwarderBalance)) {
      revert();
    }
  }
  /**
   * It is possible that funds were sent to this address before the contract was deployed.
   * We can flush those funds to the parent address.
   */
  function flush() public {
    // throws on failure
    parentAddress.transfer(address(this).balance);
  }
}
