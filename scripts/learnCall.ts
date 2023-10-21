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
    const contract = new ethers.Contract(contractAddress, erc20Artifact.abi, provider); // (a)

    // [1], Call view function (balanceOf)
    // Using "ethers.Contract"...(4)
    const owner = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    console.log('balance by normal call:', (await contract.balanceOf(`0x${owner}`)).toString()) //(※1)

    // Without using "ethers.Contract" (手動)...(5)
    const signature = "balanceOf(address)"
    const signatureHash = ethers.utils.id(signature)  //idの中身は ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature))
    console.log('signatureHash:', signatureHash)
    const selector = signatureHash.slice(2,10)
    console.log('function selector:', selector)
    const data = '0x' + selector + '000000000000000000000000' + owner  // ownerが40文字なので、64文字(256bit)にするためにゼロパディングしてる。
    console.log('data:', data)
    const ret = await provider.send("eth_call", [{"to": contractAddress, "data": data}, "latest"]) // (b)
    console.log('return string:', ret)
    console.log('balance by signatureHash:', BigInt(ret))
    /*
     - (a)と(4)の内部----------
     - デプロイされてるアクセスしたいコントラクトのアドレス...(3) + そのコントラクトのabi + そのコントラクトがデプロイされたネットワーク(イーサリア
     - ムとかポリゴンとか)にアクセスするためのプロバイダー　→　そのコントラクトにアクセスするためのオブジェクト(a)
     - ↓
     - (a)のcontractを作る時abiを渡してるおかげで contract. の後に balanceOf　と記述できる。多分。
     - ↓
     - 裏側でabiのbalanceOfの箇所見て引数の型を確認してsignatureが作られsignatureHashが作られselectorが作られる。selectorは関数のID・住所のよう
     - なもの。ネットワークにコントラクトがデプロイされるとネットワークにそのコントラクトのバイトコードなども書き込まれるわけだが、そのバイトコードか
     - ら目的の関数を探すのに使われる。多分
     - ↓
     - 裏側でselectorの後ろに関数の引数が連結される。多分...(2)
     - ↓
     - 裏側で(3)に(2)を送りつける。多分
     - ↓
     - (3)にはバイトコードが書きこまれてるので、そのバイトコードからselectorと同じ値の部分が裏側で探し出される。多分
     - ↓
     - 裏側でその値(起動したい関数の場所)を見つけたらselectorの後ろに連結された引数を関数に渡して実行される。多分
     - ↓
     - 返り値はabiのoutputに記述されてる型にしてリターンする。多分
     -
     -
     - (5)の内部----------
     - (a)を作らず(4)の裏側の箇所を手動でやってる。
     - (a)を作って(※1)のようにデプロイされたコントラクトにアクセスする代わりに、(b)のようにprovider.sendで手動で作ったdataを送り付けてる。
     - provider.sendの第一引数の"eth_call"が(a)のプロバイダー的な事なのだろうきっと。
     - provider.sendの第二引数の配列の一つ目の要素はアドレスとデータというフィールドを持ったオブジェクト。アドレスには(a)で言う(3)、データには(a)で
     - 言う(2)。配列の二つ目の要素の"latest"はよくわからん。
     - (4)とは関数を見つけるプロセスが違う。(4)では(a)を作ったおかげでcontract.balanceOfのように関数の名前を指定するだけでOK。一方(5)では関数の名前
     - から関数の住所であるselectorを手動で作って、そのselectorの後ろに関数の引数を手動で連結してそれをprovider.sendで送る必要がある。
     -
     - const tx = contract.balanceOf(hoge)
     - tx.data == balanceOfのselectorと引数を連結したもの。
    */

    // [2]. Call write function (transfer)
    // Using "ethers.Contract"
    const recipient = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    const amount = '0000000000000000000000000000000000000000000000000000000000abcdef'  // 64 chars
    const tx = await contract.populateTransaction.transfer(`0x${recipient}`, `0x${amount}`) // (c)
    console.log(tx)

    // Without using "ethers.Contract" (手動)
    const signature2 = "transfer(address,uint256)"
    const signatureHash2 = ethers.utils.id(signature2)
    const selector2 = signatureHash2.slice(2, 10)
    const data2 = '0x' + selector2 + '000000000000000000000000' + recipient + amount
    console.log(data2)      //アドレスの大文字の部分はちゃんと大文字のまま
    console.log(tx.data)    //アドレスの大文字の部分が全部小文字になる。だから data2 === tx.data で false　になる。
    console.log(data2 === tx.data)  //(※6)
    /*
     - (c)のpopulateTransactionは実際にトランザクションは実行せず、「送るならこんなデータを送るよ」というのを作ってくれる。
     - populateTransactionにした理由は、transfer()は送る側の残高が0だとダメだったり、write関数だから秘密鍵が必要だったりなど、条件を整えるのが面倒
     - だったというそれだけの理由。
     - 実際にトランザクションを送ってないという事なので、[1]のview関数の時のように関数を実行して
     - 返ってきた値をUsing "ethers.Contract"とWithout using "ethers.Contract"で比較するという事は出来ない。その代わりに「送るデータ」を比較してい
     - る(※6)。
    */
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});