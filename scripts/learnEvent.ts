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
    const contractAddress = "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; //ZNY contract
    const contract = new ethers.Contract(contractAddress, erc20Artifact.abi, provider);

    //Event hash
    console.log('Transfer Event hash:', ethers.utils.id("Transfer(address,address,uint256)"))
    console.log('Approve Event hash:', ethers.utils.id("Approval(address,address,uint256)"))

    //Get events
    const eventList = await provider.getLogs({
        fromBlock: 2000000,
        toBlock: "latest",
        address: contractAddress,
        topics: ["0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "0x0000000000000000000000000000000000000000000000000000000000000000"]
    })
    console.log(eventList)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});