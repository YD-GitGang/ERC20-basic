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
    const contractAddress = "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; //ZNY contract
    const contract = new ethers.Contract(contractAddress, erc20Artifact.abi, provider);

    // 1, Call view function (balanceOf)
    const owner = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    console.log('balance by normal call:', (await contract.balanceOf(`0x${owner}`)).toString())

    const signature = "balanceOf(address)"
    const signatureHash = ethers.utils.id(signature)  //idの中身は ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature))
    console.log('signatureHash:', signatureHash)
    const selector = signatureHash.slice(2,10)
    console.log('function selector:', selector)
    const data = '0x' + selector + '000000000000000000000000' + owner
    console.log('data:', data)
    const ret = await provider.send("eth_call", [{"to": contractAddress, "data": data}, "latest"])
    console.log('return string:', ret)
    console.log('balance by signatureHash:', BigInt(ret))

    // 2. Call write function (transfer)
    const recipient = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    const amount = '0000000000000000000000000000000000000000000000000000000000abcdef'  // 64 chars
    const tx = await contract.populateTransaction.transfer(`0x${recipient}`, `0x${amount}`)
    console.log(tx)

    const signature2 = "transfer(address,uint256)"
    const signatureHash2 = ethers.utils.id(signature2)
    const selector2 = signatureHash2.slice(2, 10)
    const data2 = '0x' + selector2 + '000000000000000000000000' + recipient + amount
    console.log(data2)      //アドレスの大文字の部分はちゃんと大文字のまま
    console.log(tx.data)    //アドレスの大文字の部分が全部小文字になる。だから data2 === tx.data で false　になる。
    console.log(data2 === tx.data)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});