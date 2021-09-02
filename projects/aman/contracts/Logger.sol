pragma solidity 0.4.24;

import './Ownable.sol';

/* A contract that provides central logging capabilities for ease of upgrading. */
contract Logger is Ownable {

    // Addresses which are authorized to log messages
    mapping (address => bool) public loggers;

    // Addresses which can add authorization
    mapping (address => bool) public authorizers;

    // Modifiers
    modifier onlyLogger { if (!loggers[msg.sender]) revert(); _; }
    modifier onlyAuthorizer { if (!authorizers[msg.sender]) revert(); _; }

    constructor() public {
      authorizers[msg.sender] = true;
    }

    // forwarder received eth
    event ForwarderDeposited(address indexed forwarder, address indexed from, uint value, bytes data);

    // main contract deposited eth
    event Deposited(address indexed wallet, address from, uint value, bytes data);

    // new wallet created
    event WalletCreated(address indexed wallet, address[3] signers, address[5] forwarders);

    function authorize(address _logger) public onlyAuthorizer {
        if (!loggers[_logger]) {
            loggers[_logger] = true;
        }
    }

    function addAuthorizer(address _authorizer) public onlyAuthorizer {
        if (!authorizers[_authorizer]) {
            authorizers[_authorizer] = true;
        }

        // authorizers can also log
        if (!loggers[_authorizer]) {
            loggers[_authorizer] = true;
        }
    }

    function logForwarderDeposited(address from, uint value, bytes data) public onlyLogger {
        emit ForwarderDeposited(msg.sender, from, value, data);
    }

    function logDeposited(address from, uint value, bytes data) public onlyLogger {
        emit Deposited(msg.sender, from, value, data);
    }

    function logWalletCreated(address wallet, address[3] signers, address[5] forwarders) public onlyLogger {
        emit WalletCreated(wallet, signers, forwarders);
    }
}
