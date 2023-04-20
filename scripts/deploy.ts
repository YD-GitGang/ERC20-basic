import { ethers } from "ethers";
import erc20Artifact from '../artifacts/contracts/ERC20.sol/ERC20.json';
import { program, Option } from "commander";
import * as dotenv from "dotenv";
dotenv.config();

async function main(name: string, symbol: string, decimals: number) {
    const privateKey: string = process.env.PRIVATE_KEY ?? "";
    if (privateKey === "") {
        throw new Error('No value set for environement variable PRIVATE_KEY');
    }

    const rpcUrl: string = process.env.SEPOLIA_URL ?? "";
    if (rpcUrl === "") {
        throw new Error('No value set for environement variable SEPOLIA_URL');
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const factory = new ethers.ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode, signer);
    const contract = await factory.deploy(name, symbol, decimals);
    console.log(`ERC20 contract deploy address ${contract.address}`);
    console.log(`Transaction URL: https://sepolia.etherscan.io/tx/${contract.deployTransaction.hash}`);
    await contract.deployed();
    console.log(`Deploy completed`)
}

program
    .addOption(new Option('--name <string>', 'name of token (e.g. bitcoin)').makeOptionMandatory())
    .addOption(new Option('--symbol <string>', 'symbol of token (e.g. BTC)').makeOptionMandatory())
    .addOption(new Option('--decimals <number>', 'decimals of token (e.g. 18)').argParser(parseInt).makeOptionMandatory()).parse()
const options = program.opts()

main(options.name, options.symbol, options.decimals).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});