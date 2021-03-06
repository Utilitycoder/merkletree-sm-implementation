const { expect, assert } = require("chai")
const { ethers } = require("hardhat")
const keccak256 = require("keccak256")
const { MerkleTree } = require("merkletreejs")

function encodeLeaf(address, spots) {
    return ethers.utils.defaultAbiCoder.encode(
        ["address", "uint64"], 
        [address, spots]
    )
}

describe("Confirm if merkle root is working", () => {
    it("Should be able to verify if an address is whitelisted or not", async () => {
        
        // We're getting 5 test addresses from ethers(Getsigners)
        const [owner, addr1, addr2, addr3, addr4, addr5] = 
        await ethers.getSigners()

        //  Let's encode arrays in the merkletree. "These form leave"
        const list = [
            encodeLeaf(owner.address, 2),
            encodeLeaf(addr1.address, 2),
            encodeLeaf(addr2.address, 2),
            encodeLeaf(addr3.address, 2),
            encodeLeaf(addr4.address, 2),
            encodeLeaf(addr5.address, 2), 
        ]
        // Create the Merkle Tree using the hashing algorithm `keccak256`
        // Make sure to sort the tree so that it can be produced deterministically regardless
        // of the order of the input list
        const merkleTree = new MerkleTree(list, keccak256, {
            hashLeaves: true,
            sortPairs: true
        })
        // Compute the Merkle Root
        const root = merkleTree.getHexRoot()

        // Let's deploy our smart contract
        const whitelist = await ethers.getContractFactory("Whitelist")
        const Whitelist = await whitelist.deploy(root)
        await Whitelist.deployed()

        // Compute the merkle proof of the owner address offchain. 
        const leaf = keccak256(list[0])
        const proof = merkleTree.getHexProof(leaf)

        // Provide the Merkle Proof to the contract, and ensure that it can verify
        // that this leaf node was indeed part of the Merkle Tree
        let verified = await Whitelist.checkInWhitelist(proof, 2)
        expect(verified).to.equal(true)

        // Provide an invalid Merkle Proof to the contract, and ensure that
        // it can verify that this leaf node was NOT part of the Merkle Tree
        verified = await Whitelist.checkInWhitelist([], 2);
        assert.equal(verified, false)


    })
})