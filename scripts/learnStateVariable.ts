import { ethers } from "ethers";
import erc20Artifact from '../artifacts/contracts/ERC20.sol/ERC20.json';
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const rpcUrl: string = process.env.SEPOLIA_URL ?? "";
    if (rpcUrl === "") {
        throw new Error('No value set for environement variable SEPOLIA_URL');
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contractAddress = "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; //ZNY contract
    const contract = new ethers.Contract(contractAddress, erc20Artifact.abi, provider);

    //Storageに記録されてるStateVariable
    for (let n of Array.from(Array(10).keys())) {
        const ret = await provider.getStorageAt(contractAddress, n)
        console.log(n, ret)
    }

    //totalSupply
    console.log('totalSupply', (await contract.totalSupply()))
    const aaa = await contract.totalSupply()
    console.log(typeof aaa)
    console.log('totalSupply', BigInt(await contract.totalSupply()))
    console.log('totalSupply', (await contract.totalSupply()).toString())
    console.log('totalSupply', parseInt(await contract.totalSupply()))
    const hex0 = await provider.getStorageAt(contractAddress, 0)
    console.log(typeof hex0)
    console.log('totalSupply from storage', hex0)
    console.log('totalSupply from storage', BigInt(hex0))
    console.log('totalSupply from storage', hex0.toString())
    console.log('totalSupply from storage', parseInt(hex0))
    console.log('totalSupply from storage', (0x0000000000000000000000000000000000000000000000000000000000abcdef).toString())
    console.log('totalSupply from storage', ('0x0000000000000000000000000000000000000000000000000000000000abcdef').toString())

    //name
    const hex1 = await provider.getStorageAt(contractAddress, 1)
    console.log(parseInt(hex1.slice(-2), 16))
    console.log(hex1.slice(-2).toString())
    console.log((0x0a).toString())
    const length1 = parseInt(hex1.slice(-2), 16)
    const encoded1 = hex1.slice(0, 2 + length1)
    console.log(length1, encoded1)
    console.log('name from storage:', ethers.utils.toUtf8String(encoded1))

    //decimals and owner
    const hex3 = await provider.getStorageAt(contractAddress, 3)
    const bytesDecimals = hex3.slice(-2)
    const bytesOwner = hex3.slice(-42, -2)
    console.log('decimals from storage:', parseInt(bytesDecimals, 16))
    console.log('owner address from storage:', bytesOwner)

    //mappingのbalances
    const owner = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    console.log('balance of owner account:', (await contract.balanceOf(`0x${owner}`)))
    console.log(typeof (await contract.balanceOf(`0x${owner}`)))
    console.log((await contract.balanceOf(`0x${owner}`)).toString())
    console.log(parseInt(await contract.balanceOf(`0x${owner}`)))
    console.log(BigInt(await contract.balanceOf(`0x${owner}`)))
    const key = `000000000000000000000000${owner}` // 24 + 40 = 64 chars
    const slot4 = '0000000000000000000000000000000000000000000000000000000000000004' // 64 chars
    const hash = ethers.utils.keccak256('0x' + key + slot4)
    const hexKey = await provider.getStorageAt(contractAddress, hash)
    console.log('balance of account from storage', BigInt(hexKey))
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});