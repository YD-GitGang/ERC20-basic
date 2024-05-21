import { ethers } from "ethers";
import erc20Artifact from '../artifacts/contracts/ERC20.sol/ERC20.json';  // (※1)
import { program, Option } from "commander";
import type { Signer } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

function getRpcUrl (network: string): string {   // (※3)
    if (network == "polygon") {
        return process.env.POLYGON_URL ?? "";    // (※4)
    } else if (network == "sepolia") {
        return process.env.SEPOLIA_URL ?? "";
    } else {
        return ""
    }
}
/** 
 * (※3)
 * awaitしない理由
 * ファイルシステムにアクセスする場合は時間がかかる。だから.envから値を取ってくるこの作業はawaitにするべきだと思ったけど、process.envを使って
 * る場合は時間がかからないのかな、きっと。
 * 
 * (※4)
 * 「?? ""」と記述する理由
 * .envファイルにURLが正しく記載されてるとは限らない。その不確定な状態でprocess.env.POLYGON_URLとしてもし.envファイルにPOLYGON_URLがなか
 * ったら、返り値が string じゃなくて undefined になっちゃうよとVSCodeがエラーをだす。というのも返り値を string と厳しく設定しているから。
 * だから.envファイルから想定してるものが取れなくても警告を出されないように「?? ""」と書いたわけだ。
*/

function transactionExplorerUrl(network: string, txHash: string): string {
    if (network == "polygon") {
        return `https://polygonscan.com/tx/${txHash}`
    } else if (network == "sepolia") {
        return `https://sepolia.etherscan.io/tx/${txHash}`
    } else {
        return ""    // (※5)
    }
}
/** 
 * (※5)
 * (※6)の .choices(['polygon', 'sepolia']) で二択に絞ってるから(※5)いらないよな...
*/

async function getOption (network: string, signer: Signer) : Promise<object> {
    if (network == "polygon") {
        const feeData = await signer.provider?.getFeeData();
        const gasPrice = feeData?.gasPrice;
        if (gasPrice != undefined) {
            console.log(`gasPrice: ${gasPrice.div(10 ** 9).toString()} Gwei`)
            return { gasPrice }
        } else {
            const gasPriceInGwei = 200;
            console.log(`No fee data available. gasPrice is set to ${gasPriceInGwei} Gwei`);
            console.log('See https://polygonscan.com/gastracker and adjust it to the current gas price');
            return { gasPrice: gasPriceInGwei * 10 ** 9 }
        }
    } else {
        return {}
    }
}

async function main(network: string, name: string, symbol: string, decimals: number) {
    const privateKey: string = process.env.PRIVATE_KEY ?? "";
    if (privateKey === "") {
        throw new Error('No value set for environement variable PRIVATE_KEY');
    }

    const rpcUrl: string = getRpcUrl(network);
    if (rpcUrl === "") {
        throw new Error('No value set for environement variable of network URL');
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const chainId = (await provider.getNetwork()).chainId;
    const option = await getOption(network, signer);

    const factory = new ethers.ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode, signer);  // (※2)
    const contract = await factory.deploy(name, symbol, decimals, option);
    console.log(`ERC20 contract deploy address ${contract.address}`);
    console.log(`Transaction URL: ${transactionExplorerUrl(network, contract.deployTransaction.hash)}`);
    await contract.deployed();
    console.log(`Deploy completed`)
    console.log(JSON.stringify({chainId, address: contract.address, symbol, name, decimals, logo: ""}))
}

program
    .addOption(new Option('--network <string>', 'name of blockchain network(e.g. polygon, sepolia)').choices(['polygon', 'sepolia']).makeOptionMandatory()) //(※6)
    .addOption(new Option('--name <string>', 'name of token (e.g. bitcoin)').makeOptionMandatory())
    .addOption(new Option('--symbol <string>', 'symbol of token (e.g. BTC)').makeOptionMandatory())
    .addOption(new Option('--decimals <number>', 'decimals of token (e.g. 18)').argParser(parseInt).makeOptionMandatory()).parse()
const options = program.opts()

main(options.network, options.name, options.symbol, options.decimals).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

/*
 - (※1)
 - ContractFactoryでabiとbytecodeを使うためにインポート。
 - 
 - (※2)
 - hardhatを使わず素のethersでデプロイしてるので、getContractFactory("コントラクト名") ではなく ContractFactory(abi, bytecode, signer)。
 - hardhatのgetContractFactoryはabiとか色々かき集めるから待ってくれということでawaitだが、素のethersはabiとかを直で渡してコントラクトのイン
 - スタンスをつくるからnew、多分。hardhatネットワークを使ったテストではなく本番環境に書き込むのでhardhatのテストと違ってsignerが必要。
*/