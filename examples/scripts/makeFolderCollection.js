//
// this is an example of how to call the mintHelper user module
//

let collectionMetaData = metadataFactory.createCollectionMetadata('my-folder-collection', [
    ['Twitter', '@dkackman'],
    ['webstite', 'https://github.com/dkackman/chia-repl']
]);

await mintHelper.mintCollectionFromFolder(1,
    'txch1xvggspky3kh2tdwd252j04d6mjytsryexkpmgf4s22utu4qjvmfq5dfkzy',
    collectionMetaData,
    'C:\\tmp\\nft',
    '.jpg',
    10,
    'txch1xvggspky3kh2tdwd252j04d6mjytsryexkpmgf4s22utu4qjvmfq5dfkzy',
    150);
