pragma solidity 0.4.24;

import "./ProxyFactory.sol";
import "./Logger.sol";
import "./WalletSimple.sol";

contract WalletFactory {
  // ProxyFactory address and address of deployed Forwarder target
  address public factory;
  address public oracle;
  address public arbiter;
  address public forwarderTemplate;
  address public walletTemplate;

  /* The central logger contract. */
  Logger public logger;

  /**
   * Set up a simple multi-sig wallet by specifying the signers allowed to be used on this wallet.
   * 2 signers will be required to send a transaction from this wallet.
   * Note: The sender is NOT automatically added to the list of signers.
   * Signers CANNOT be changed once they are set
   */
  constructor(address _factory, address _walletTemplate, address _forwarderTemplate, address _logger, address _oracle, address _arbiter) public {
    require(_factory != 0x0);
    require(_forwarderTemplate != 0x0);
    require(_walletTemplate != 0x0);
    require(_logger != 0x0);
    require(_oracle != 0x0);
    require(_arbiter != 0x0);

    logger = Logger(_logger);
    factory = _factory;
    forwarderTemplate = _forwarderTemplate;
    walletTemplate = _walletTemplate;
    oracle = _oracle;
    arbiter = _arbiter;
  }

  /**
   * Create a new wallet
   * returns address of newly created forwarder address
   *
   * @param user User's multisig signing address
   */
  function createWallet(address user) public returns (address) {
    WalletSimple wallet = WalletSimple(ProxyFactory(factory).createProxy(walletTemplate, new bytes(0x0)));

    // authorize the wallet
    address walletAddress = address(wallet);
    logger.addAuthorizer(walletAddress);

    address[3] memory signers = [user, oracle, arbiter];
    wallet.initialize(signers, factory, forwarderTemplate, address(logger));

    address[5] memory forwarders;
    for (uint i = 0; i < 5; i++) {
      address fwd = wallet.createForwarder();
      forwarders[i] = fwd;
    }

    logger.logWalletCreated(walletAddress, signers, forwarders);

    return walletAddress;
  }

  /*
   * Fallback function (NOT payable)
   * When called, will create a new wallet with msg.sender's address
   */
  function () external {
    createWallet(msg.sender);
  }

}
