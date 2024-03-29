import _ from 'lodash';
import NftBulkMinter from './nft_bulk_minter.js';

export default class NftCollectionMinter {
    constructor(minter, fee = 0, royaltyAddress = '', royaltyPercentage = 0) {
        if (_.isNil(minter)) {
            throw Error('minter cannot be nil');
        }
        this.minter = minter;
        this.fee = fee;
        this.royaltyAddress = royaltyAddress;
        this.royaltyPercentage = royaltyPercentage;
    }

    createMintInfo(nftInfos) {
        if (_.isNil(nftInfos)) {
            throw Error('nftInfos cannot be nil');
        }
        if (!_.isArrayLike(nftInfos)) {
            throw Error('nftInfos must be an array');
        }
        if (nftInfos.length > 25) {
            throw Error('Only collection of 25 or less supported right now');
        }
        return {
            wallet_id: this.minter.walletId,
            royalty_address: this.royaltyPercentage > 0 ? this.royaltyAddress : undefined,
            royalty_percentage: this.royaltyPercentage,
            fee: this.fee,
            metadata_list: nftInfos,
            mint_number_start: 1,
            mint_total: nftInfos.length,
        };
    }

    async mint(bulkMintInfo) {
        return await this.minter.mint(bulkMintInfo);
    }

    async mintAndSubmit(bulkMintInfo) {
        return await this.minter.mintAndSubmit(bulkMintInfo);
    }
}
