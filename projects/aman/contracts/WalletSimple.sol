pragma solidity 0.4.24;

import "./Forwarder.sol";
import "./ERC20Interface.sol";
import "./ProxyFactory.sol";
import "./Logger.sol";
/**
 *
 * WalletSimple
 * ============
 *
 * Basic multi-signer wallet designed for use in a co-signing environment where 2 signatures are required to move funds.
 * Typically used in a 2-of-3 signing configuration. Uses ecrecover to allow for 2 signatures in a single transaction.
 *
 * The first signature is created on the operation hash (see Data Formats) and passed to sendMultiSig/sendMultiSigToken
 * The signer is determined by verifyMultiSig().
 *
 * The second signature is created by the submitter of the transaction and determined by msg.signer.
 *
 * Data Formats
 * ============
 *
 * The signature is created with ethereumjs-util.ecsign(operationHash).
 * Like the eth_sign RPC call, it packs the values as a 65-byte array of [r, s, v].
 * Unlike eth_sign, the message is not prefixed.
 *
 * The operationHash the result of keccak256(prefix, toAddress, value, data, expireTime).
 * For ether transactions, `prefix` is "ETHER".
 * For token transaction, `prefix` is "ERC20" and `data` is the tokenContractAddress.
 *
 *
 */
contract WalletSimple {
  // Events
  event SafeModeActivated(address msgSender);
  event ForwarderCreated(address forwarder);
  event Transacted(
    address msgSender, // Address of the sender of the message initiating the transaction
    address otherSigner, // Address of the signer (second signature) used to initiate the transaction
    bytes32 operation, // Operation hash (see Data Formats)
    address toAddress, // The address the transaction was sent to
    uint value, // Amount of Wei sent to the address
    bytes data // Data sent when invoking the transaction
  );
  // Public fields
  address[] public signers; // The addresses that can co-sign transactions on the wallet
  bool public safeMode = true; // When active, wallet may only send to signer addresses
  // Internal fields
  uint constant SEQUENCE_ID_WINDOW_SIZE = 10;
  uint[10] public recentSequenceIds;

  // ProxyFactory address and address of deployed Forwarder target
  address public factory;
  address public target;

  /* The central logger contract. */
  Logger public logger;

  bool public initialized;
  modifier once { if (initialized) revert(); _; }

  /**
   * Set up a simple multi-sig wallet by specifying the signers allowed to be used on this wallet.
   * 2 signers will be required to send a transaction from this wallet.
   * Note: The sender is NOT automatically added to the list of signers.
   * Signers CANNOT be changed once they are set
   *
   * @param allowedSigners An array of signers on the wallet
   * @param allowedSigners An array of signers on the wallet
   */
  function initialize(address[3] allowedSigners, address _factory, address _forwarder, address _logger) public once {
    require(_factory != 0x0);
    require(_forwarder != 0x0);
    require(_logger != 0x0);

    initialized = true;

    logger = Logger(_logger);
    signers = allowedSigners;
    factory = _factory;
    target = _forwarder;
  }
  /**
   * Determine if an address is a signer on this wallet
   * @param signer address to check
   * returns boolean indicating whether address is signer or not
   */
  function isSigner(address signer) public view returns (bool) {
    // Iterate through all signers on the wallet and
    for (uint i = 0; i < signers.length; i++) {
      if (signers[i] == signer) {
        return true;
      }
    }
    return false;
  }
  /**
   * Modifier that will execute internal code block only if the sender is an authorized signer on this wallet
   */
  modifier onlySigner {
    if (!isSigner(msg.sender)) {
      revert();
    }
    _;
  }
  /**
   * Gets called when a transaction is received without calling a method
   */
  function() external payable {
    require(msg.data.length == 0);

    if (msg.value > 0) {
      // Fire deposited event if we are receiving funds
      logger.logDeposited(msg.sender, msg.value, msg.data);
    }
  }
  /**
   * Create a new contract (and also address) that forwards funds to this contract
   * returns address of newly created forwarder address
   */
  function createForwarder() public returns (address) {
    Forwarder forwarder = Forwarder(ProxyFactory(factory).createProxy(target, new bytes(0x0)));
    forwarder.initialize(address(logger));
    address forwarderAddress = address(forwarder);
    logger.authorize(forwarderAddress);
    emit ForwarderCreated(forwarderAddress);
    return forwarderAddress;
  }
  /**
   * Execute a multi-signature transaction from this wallet using 2 signers: one from msg.sender and the other from ecrecover.
   * Sequence IDs are numbers starting from 1. They are used to prevent replay attacks and may not be repeated.
   *
   * @param toAddress the destination address to send an outgoing transaction
   * @param value the amount in Wei to be sent
   * @param data the data to send to the toAddress when invoking the transaction
   * @param expireTime the number of seconds since 1970 for which this transaction is valid
   * @param sequenceId the unique sequence id obtainable from getNextSequenceId
   * @param signature see Data Formats
   */
  function sendMultiSig(
      address toAddress,
      uint value,
      bytes data,
      uint expireTime,
      uint sequenceId,
      bytes signature
  ) public onlySigner {
    bytes memory packed = abi.encodePacked("ETHER", toAddress, value, data, expireTime, sequenceId);

    // Verify the other signer
    bytes32 operationHash = keccak256(packed);

    address otherSigner = verifyMultiSig(toAddress, operationHash, signature, expireTime, sequenceId);
    // Success, send the transaction
    if (!(toAddress.call.value(value)(data))) {
      // Failed executing transaction
      revert();
    }
    emit Transacted(msg.sender, otherSigner, operationHash, toAddress, value, data);
  }

  /**
   * Execute a multi-signature token transfer from this wallet using 2 signers: one from msg.sender and the other from ecrecover.
   * Sequence IDs are numbers starting from 1. They are used to prevent replay attacks and may not be repeated.
   *
   * @param toAddress the destination address to send an outgoing transaction
   * @param value the amount in tokens to be sent
   * @param tokenContractAddress the address of the erc20 token contract
   * @param expireTime the number of seconds since 1970 for which this transaction is valid
   * @param sequenceId the unique sequence id obtainable from getNextSequenceId
   * @param signature see Data Formats
   */
  function sendMultiSigToken(
      address toAddress,
      uint value,
      address tokenContractAddress,
      uint expireTime,
      uint sequenceId,
      bytes signature
  ) public onlySigner {
    bytes memory packed = abi.encodePacked("ERC20", toAddress, value, tokenContractAddress, expireTime, sequenceId);

    // Verify the other signer
    bytes32 operationHash = keccak256(packed);

    verifyMultiSig(toAddress, operationHash, signature, expireTime, sequenceId);

    ERC20Interface instance = ERC20Interface(tokenContractAddress);
    if (!instance.transfer(toAddress, value)) {
        revert();
    }
  }

  /**
   * Execute a token flush from one of the forwarder addresses. This transfer needs only a single signature and can be done by any signer
   *
   * @param forwarderAddress the address of the forwarder address to flush the tokens from
   * @param tokenContractAddress the address of the erc20 token contract
   */
  function flushForwarderTokens(
    address forwarderAddress,
    address tokenContractAddress
  ) public onlySigner {
    Forwarder forwarder = Forwarder(forwarderAddress);
    forwarder.flushTokens(tokenContractAddress);
  }
  /**
   * Do common multisig verification for both eth sends and erc20token transfers
   *
   * @param toAddress the destination address to send an outgoing transaction
   * @param operationHash see Data Formats
   * @param signature see Data Formats
   * @param expireTime the number of seconds since 1970 for which this transaction is valid
   * @param sequenceId the unique sequence id obtainable from getNextSequenceId
   * returns address that has created the signature
   */
  function verifyMultiSig(
      address toAddress,
      bytes32 operationHash,
      bytes signature,
      uint expireTime,
      uint sequenceId
  ) private returns (address) {
    address otherSigner = recoverAddressFromSignature(operationHash, signature);
    // Verify if we are in safe mode. In safe mode, the wallet can only send to signers
    if (safeMode && !isSigner(toAddress)) {
      // We are in safe mode and the toAddress is not a signer. Disallow!
      revert();
    }
    // Verify that the transaction has not expired
    if (expireTime < block.timestamp) {
      // Transaction expired
      revert();
    }
    // Try to insert the sequence ID. Will revert if the sequence id was invalid
    tryInsertSequenceId(sequenceId);
    if (!isSigner(otherSigner)) {
      // Other signer not on this wallet or operation does not match arguments
      revert();
    }
    if (otherSigner == msg.sender) {
      // Cannot approve own transaction
      revert();
    }
    return otherSigner;
  }
  /**
   * Irrevocably puts contract into safe mode. When in this mode, transactions may only be sent to signing addresses.
   */
  function activateSafeMode() public onlySigner {
    safeMode = true;
    emit SafeModeActivated(msg.sender);
  }
  /**
   * Gets signer's address using ecrecover
   * @param operationHash see Data Formats
   * @param signature see Data Formats
   * returns address recovered from the signature
   */
  function recoverAddressFromSignature(
    bytes32 operationHash,
    bytes signature
  ) private pure returns (address) {
    if (signature.length != 65) {
      revert();
    }
    // We need to unpack the signature, which is given as an array of 65 bytes (like eth.sign)
    bytes32 r;
    bytes32 s;
    uint8 v;
    assembly {
      r := mload(add(signature, 32))
      s := mload(add(signature, 64))
      v := and(mload(add(signature, 65)), 255)
    }
    if (v < 27) {
      v += 27; // Ethereum versions are 27 or 28 as opposed to 0 or 1 which is submitted by some signing libs
    }
    return ecrecover(operationHash, v, r, s);
  }
  /**
   * Verify that the sequence id has not been used before and inserts it. Throws if the sequence ID was not accepted.
   * We collect a window of up to 10 recent sequence ids, and allow any sequence id that is not in the window and
   * greater than the minimum element in the window.
   * @param sequenceId to insert into array of stored ids
   */
  function tryInsertSequenceId(uint sequenceId) private onlySigner {
    // Keep a pointer to the lowest value element in the window
    uint lowestValueIndex = 0;
    for (uint i = 0; i < SEQUENCE_ID_WINDOW_SIZE; i++) {
      if (recentSequenceIds[i] == sequenceId) {
        // This sequence ID has been used before. Disallow!
        revert();
      }
      if (recentSequenceIds[i] < recentSequenceIds[lowestValueIndex]) {
        lowestValueIndex = i;
      }
    }
    if (sequenceId < recentSequenceIds[lowestValueIndex]) {
      // The sequence ID being used is lower than the lowest value in the window
      // so we cannot accept it as it may have been used before
      revert();
    }
    if (sequenceId > (recentSequenceIds[lowestValueIndex] + 10000)) {
      // Block sequence IDs which are much higher than the lowest value
      // This prevents people blocking the contract by using very large sequence IDs quickly
      revert();
    }
    recentSequenceIds[lowestValueIndex] = sequenceId;
  }
  /**
   * Gets the next available sequence ID for signing.
   * Returns the sequenceId one higher than the highest value
   * in the lowest sequence
   *
   * IE, if recentSequenceIds == [0,100,200,40,75,10,1,4,2,5], return 3
   */
  function getNextSequenceId() public view returns (uint) {
    // first, find the lowest value index
    uint lowestValueIndex = 0;
    for (uint i = 0; i < SEQUENCE_ID_WINDOW_SIZE; i++) {
      if (recentSequenceIds[i] < recentSequenceIds[lowestValueIndex]) {
        lowestValueIndex = i;
      }
    }

    // then, iterate through the sequenceIds until it finds an empty one
    uint nextSequenceId = recentSequenceIds[lowestValueIndex] + 1;
    bool found = false;

    for (uint j = 0; j <= SEQUENCE_ID_WINDOW_SIZE; j++) {
      // zero points for elegance
      found = false;
      for (uint k = 0; k < SEQUENCE_ID_WINDOW_SIZE; k++) {
        if (nextSequenceId == recentSequenceIds[k]) {
          found = true;
        }
      }

      // if it's not in the array, it's an availalbe slot
      if (!found) {
        break;
      }

      nextSequenceId++;
    }

    return nextSequenceId;
  }
}
