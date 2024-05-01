import { Address, toNano } from '@ton/core';
import { SbtCollection } from '../wrappers/SbtCollection';
import { TonClient4, WalletContractV4 } from '@ton/ton';

export async function run() {
    const client4 = new TonClient4({
        endpoint: 'https://sandbox-v4.tonhubapi.com', // Test-net
    });

    let collectionAddress = Address.parse('EQBjtJdNYB9-e97M5-kKY0XzgA8vDpty-1oFsRPfjRYX0Lii');

    let collectionClient = client4.open(SbtCollection.fromAddress(collectionAddress));

    let latestIndexId = (await collectionClient.getGetCollectionData()).next_item_index;
    const currentIndexId = latestIndexId - 1n;
    console.log('collection supply: [' + currentIndexId + ']');

    for (let index = 1n; index <= currentIndexId; index++) {
        let itemAddress = await collectionClient.getGetNftAddressByIndex(index);
        console.log('NFT ID [' + index + '] : ' + itemAddress);
    }
}

run();
