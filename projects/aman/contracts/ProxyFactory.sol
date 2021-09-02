/***
* Shoutouts:
*
* Bytecode origin https://www.reddit.com/r/ethereum/comments/6ic49q/any_assembly_programmers_willing_to_write_a/dj5ceuw/
* Modified version of Vitalik's https://www.reddit.com/r/ethereum/comments/6c1jui/delegatecall_forwarders_how_to_save_5098_on/
* Credits to Jorge Izquierdo (@izqui) for coming up with this design here: https://gist.github.com/izqui/7f904443e6d19c1ab52ec7f5ad46b3a8
* Credits to Stefan George (@Georgi87) for inspiration for many of the improvements from Gnosis Safe: https://github.com/gnosis/gnosis-safe-contracts
*
* This version has many improvements over the original @izqui's library like using REVERT instead of THROWing on failed calls.
* It also implements the awesome design pattern for initializing code as seen in Gnosis Safe Factory: https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/ProxyFactory.sol
* but unlike this last one it doesn't require that you waste storage on both the proxy and the proxied contracts (v. https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/Proxy.sol#L8 & https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol#L14)
*
***/
pragma solidity ^0.4.19;
contract ProxyFactory {
    function createProxy(address _target, bytes _data) public returns (address proxyContract) {
       assembly {
           let contractCode := mload(0x40)                 // Find empty storage location using "free memory pointer"

           mstore(add(contractCode, 0x0e), _target) // Add target address, 14 bytes offset to later accomodate first part of the bytecode
           mstore(sub(contractCode, 0x06), 0x000000000000603a600c600039603a6000f33660008037611000600036600073)     // First part of the bytecode, shifted left 6 bytes, overwrites padding of target address
           mstore(add(contractCode, 0x2e), 0x5af43d6000803e80600081146053573d6000f35b3d6000fd0000000000000000)     // Final part of bytecode, 32 bytes after target
           proxyContract := create(0, contractCode, 0x46)    // total length 70 bytes in dec = 46 bytes in hex
           if iszero(extcodesize(proxyContract)) { revert(0,0) }

           // check if the _data.length > 0 and if it is forward it to the newly created contract
           if iszero(iszero(mload(_data))) {
               if call(gas, proxyContract, 0, add(_data, 0x20), mload(_data), 0, 0) { revert(0, 0) }
           }
       }

       emit ProxyDeployed(proxyContract, _target);
    }

    event ProxyDeployed(address proxyAddress, address targetAddress);
}
/***
*
* PROXY contract (bytecode)
603a600c600039603a6000f33660008037611000600036600073f00df00df00df00df00df00df00df00df00df00d5af43d6000803e80600081146053573d6000f35b3d6000fd
*
* PROXY contract (opcodes)
0 PUSH1 0x3a
2 PUSH1 0x0c
4 PUSH1 0x00
6 CODECOPY
7 PUSH1 0x3a
9 PUSH1 0x00
11 RETURN
12 CALLDATASIZE
13 PUSH1 0x00
15 DUP1
16 CALLDATACOPY
17 PUSH2 0x1000
20 PUSH1 0x00
22 CALLDATASIZE
23 PUSH1 0x00
25 PUSH20 0xf00df00df00df00df00df00df00df00df00df00d    <- Placeholder for the hardcoded address replaced by the factory
46 GAS
47 DELEGATECALL
48 RETURNDATASIZE
49 PUSH1 0x00
51 DUP1
52 RETURNDATACOPY
53 DUP1
54 PUSH1 0x00
56 DUP2
57 EQ
58 PUSH1 0x53
60 JUMPI
61 RETURNDATASIZE
62 PUSH1 0x00
64 RETURN
65 JUMPDEST
66 RETURNDATASIZE
67 PUSH1 0x00
69 REVERT
*
***/
