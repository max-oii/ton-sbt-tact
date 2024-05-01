import { SendMode, beginCell, contractAddress, fromNano, internal, toNano } from '@ton/core';
import { SbtCollection } from '../wrappers/SbtCollection';
import { TonClient4, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import * as dotenv from 'dotenv';
import { sleep } from '@ton/blueprint';
dotenv.config();

async function run() {
    const client4 = new TonClient4({
        endpoint: 'https://sandbox-v4.tonhubapi.com', // Test-net
    });

    let mnemonics = (process.env.PK || '').toString(); // 🔴 Change to your own, by creating .env file!
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
    let secretKey = keyPair.secretKey;
    let workchain = 0;
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    let walletContract = client4.open(wallet);
    console.log('Wallet address: ', walletContract.address);

    let seqno: number = await walletContract.getSeqno();
    console.log('Current deployment wallet seqno: ', seqno);
    let balance: bigint = await walletContract.getBalance();
    console.log('Current deployment wallet balance: ', fromNano(balance).toString(), '💎TON');

    // Replace owner with your address
    let owner = wallet.address;

    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    const collectionContent = 'https://s.getgems.io/nft/b/c/62fba50217c3fe3cbaad9e7f/';
    const newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(collectionContent).endCell();

    let init = await SbtCollection.init(owner, newContent);
    let deployContract = contractAddress(0, init);

    let deployAmount = toNano('0.1');

    await walletContract.sendTransfer({
        seqno,
        secretKey,
        messages: [
            internal({
                to: deployContract,
                value: deployAmount,
                init: { code: init.code, data: init.data },
                bounce: true,
                // body: packed,
            }),
        ],
    });

    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log('waiting for transaction to confirm...');
        await sleep(1500);
        currentSeqno = await walletContract.getSeqno();
    }
    console.log('transaction confirmed!');
    console.log('sbt collection address:', deployContract);

    // const sbtCollection = provider.open(await SbtCollection.fromInit(owner, newContent));

    // await sbtCollection.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.1'),
    //     },
    //     {
    //         $$type: 'RequestMint',
    //         owner_address: provider.sender().address!,
    //         authority_address: provider.sender().address!,
    //     },
    // );

    // console.log('Deploying SbtCollection...');

    // await provider.waitForDeploy(sbtCollection.address);

    // console.log('Collection Address', sbtCollection.address);
}

run();
