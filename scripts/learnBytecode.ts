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
    const contractAddress = "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; //ZNY contract
    //const contract = new ethers.Contract(contractAddress, erc20Artifact.abi, provider);

    const bytecodeOnNetwork: string = await provider.getCode(contractAddress);
    const bytecode: string = erc20Artifact.bytecode
    const deployedBytecode: string = erc20Artifact.deployedBytecode
    console.log('bytecode === bytecodeOnNetwork', bytecode === bytecodeOnNetwork)
    console.log('deployedBytecode === bytecodeOnNetwork', deployedBytecode === bytecodeOnNetwork)
    console.log('bytecode length', bytecode.length)
    console.log('deployedBytecode lengthe', deployedBytecode.length)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});