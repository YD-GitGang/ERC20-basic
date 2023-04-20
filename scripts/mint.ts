import { ethers } from "ethers";
import erc20Artifact from '../artifacts/contracts/ERC20.sol/ERC20.json';
import { program, Option } from "commander";
import * as dotenv from "dotenv";
import type { Signer } from "ethers";
dotenv.config();


function getRpcURL(network: string) : string {
    if (network == "polygon") {
        return process.env.POLYGON_URL ?? "";
    } else if (network == "sepolia") {
        return process.env.SEPOLIA_URL ?? "";
    } else {
        return ""
    }
}

function transactionExplorerUrl(network: string, txHash: string) : string {
    if (network == "polygon") {
        return `https://polygonscan.com/tx/${txHash}`;
    } else if (network == "sepolia") {
        return `https://sepolia.etherscan.io/tx/${txHash}`;
    } else {
        return ""
    }
}

async function getOption (network: string, signer: Signer) : Promise<object> {
    if (network == "polygon") {
        const feeData = await signer.provider?.getFeeData()
        const gasPrice = feeData?.gasPrice
        if (gasPrice != undefined) {
            console.log(`gasPrice: ${gasPrice.div(10 ** 9).toString()} Gwei`)
        }
        return { gasPrice }
    } else {
        return {}
    }
}

async function main(network: string, contractAddress: string, accountAddress: string, amount: number){
    const privateKey: string = process.env.PRIVATE_KEY ?? "";
    if (privateKey === "") {
        throw new Error('No value set for environement variable PRIVATE_KEY');
    }

    const rpcUrl: string = getRpcURL(network);
    if (rpcUrl === "") {
        throw new Error('No value set for environement variable SEPOLIA_URL');
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const option = await getOption(network, signer)

    const contract = new ethers.Contract(contractAddress, erc20Artifact.abi, signer);
    const decimals: number = await contract.decimals();
    const rawAmount: bigint = BigInt(Math.floor(amount * (10 ** decimals)));
    const tx = await contract.mint(accountAddress, rawAmount, option);
    console.log(`Transaction URL: ${transactionExplorerUrl(network, tx.hash)}`);

    const receipt = await tx.wait();
    console.log("completed")

    console.log("###############################")
    console.log(receipt.logs)
    console.log("###############################")
    console.log(typeof receipt.logs)
    console.log("###############################")

    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    console.log(contract.interface.parseLog(receipt.logs[0]))
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    console.log(typeof contract.interface.parseLog(receipt.logs[0]))
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

    console.log("/////////////////////////////////////////////////")
    for (let log of receipt.logs) {
        try {
            console.log(log)
            const event = contract.interface.parseLog(log);
            console.log(event)
            console.log(typeof event)
            console.log(`Event Name: ${event['name']}`)
            console.log(`      Args: ${event['args']}`)
        } catch (e) {}
    }
    console.log("/////////////////////////////////////////////////")
}

program
    .addOption(
        new Option(
            '--network <string>', 'name of blockchain network (e.g. polygon, sepolia)').choices(['polygon', 'sepolia']).makeOptionMandatory())
    .addOption(
        new Option(
            '--contractAddress <address>', 'address of token contract').makeOptionMandatory())
    .addOption(
        new Option(
            '--accountAddress <address>', 'mint token to this account address').makeOptionMandatory())
    .addOption(
        new Option(
            '--amount <number>', 'amount of token minted (e.g. 1.23)').argParser(parseFloat).makeOptionMandatory()).parse()
const options = program.opts()

main(options.network, options.contractAddress, options.accountAddress, options.amount).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});