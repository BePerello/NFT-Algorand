const metadata = undefined;
const algosdk = require("algosdk");

const waitForConfirmation = async function (algodClient, txId, timeout) {
  if (algodClient == null || txId == null || timeout < 0) {
    throw new Error("Bad arguments");
  }

  const status = await algodClient.status().do();
  if (status === undefined) {
    throw new Error("Unable to get node status");
  }

  const startround = status["last-round"] + 1;
  let currentround = startround;

  while (currentround < startround + timeout) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    if (pendingInfo !== undefined) {
      if (
        pendingInfo["confirmed-round"] !== null &&
        pendingInfo["confirmed-round"] > 0
      ) {
        // Obteve a transação concluída
        return pendingInfo;
      } else {
        if (
          pendingInfo["pool-error"] != null &&
          pendingInfo["pool-error"].length > 0
        ) {
          // Se houve um erro de pool, a transação foi rejeitada!
          throw new Error(
            "Transaction " +
              txId +
              " rejected - pool error: " +
              pendingInfo["pool-error"]
          );
        }
      }
    }
    await algodClient.statusAfterBlock(currentround).do();
    currentround++;
  }
  throw new Error(
    "Transaction " + txId + " not confirmed after " + timeout + " rounds!"
  );
};
const printCreatedAsset = async function (algodClient, account, assetid) {
  let accountInfo = await algodClient.accountInformation(account).do();
  for (idx = 0; idx < accountInfo["created-assets"].length; idx++) {
    let scrutinizedAsset = accountInfo["created-assets"][idx];
    if (scrutinizedAsset["index"] == assetid) {
      console.log("AssetID = " + scrutinizedAsset["index"]);
      let myparms = JSON.stringify(scrutinizedAsset["params"], undefined, 2);
      console.log("parms = " + myparms);
      break;
    }
  }
};
// Função usada para imprimir o saldo da conta e o assetid
const printAssetHolding = async function (algodClient, account, assetid) {
  let accountInfo = await algodClient.accountInformation(account).do();
  for (idx = 0; idx < accountInfo["assets"].length; idx++) {
    let scrutinizedAsset = accountInfo["assets"][idx];
    if (scrutinizedAsset["asset-id"] == assetid) {
      let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
      console.log("assetholdinginfo = " + myassetholding);
      break;
    }
  }
};
async function createAsset(algodClient, creator) {
  console.log("");
  console.log("==> CRIANDO ASSET");
  // Checar o saldo da conta
  const accountInfo = await algodClient.accountInformation(creator.addr).do();
  const startingAmount = accountInfo.amount;
  console.log("O saldo de sua conta é de: %d microAlgos", startingAmount);

  // Construir a transação
  const params = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: creator.addr,
    total: 1, // 1 é a quantidade padrão na criação de NFT
    decimals: 0, // 0 é o decimals padrão na criação de NFT
    assetName: "Sloth",
    unitName: "SLOTH",
    assetURL: "https://gateway.pinata.cloud/ipfs/QmUL6rRhcnEjY83iDnYav25piCnfE1F3TqawjszAQsbRJK",
    assetMetadataHash: metadata,
    defaultFrozen: false,
    freeze: undefined,
    manager: creator.addr,
    clawback: undefined,
    reserve: undefined,
    suggestedParams: params,
  });

  const rawSignedTxn = txn.signTxn(creator.sk);
  const tx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  let assetID = null;
  // Aguardar a transação ser confirmada
  const confirmedTxn = await waitForConfirmation(algodClient, tx.txId, 4);
  // Obter a transação completa
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
  let ptx = await algodClient.pendingTransactionInformation(tx.txId).do();
  assetID = ptx["asset-index"];
  // console.log("AssetID = " + assetID);

  await printCreatedAsset(algodClient, creator.addr, assetID);
  await printAssetHolding(algodClient, creator.addr, assetID);

  return { assetID };
}
const createAccount = function () {
  try {
    const myaccount = algosdk.generateAccount();
    console.log("••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••");
    console.log("Endereço de sua conta ============> " + myaccount.addr);
    let account_mnemonic = algosdk.secretKeyToMnemonic(myaccount.sk);
    console.log("Sua Chave Secreta ===========> " + account_mnemonic);
    console.log("••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••");
    console.log("ATENÇÃO!!! Anote o Endereço e Chave Secreta de Sua Conta");
    console.log("Para prosseguir, adicione saldo TestNet na sua conta usando o Dispenser, LINK ABAIXO ↓↓↓↓↓↓ ");
    console.log(
      "https://dispenser.testnet.aws.algodev.network/?account=" + myaccount.addr
    );

    return myaccount;
  } catch (err) {
    console.log("err", err);
  }
};

const keypress = async () => {
  process.stdin.setRawMode(true);
  return new Promise((resolve) =>
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      resolve();
    })
  );
};

async function createNFT() {
  try {
    let creator = createAccount();
    console.log("•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••");
    console.log("JA ADICIONOU SALDO NA SUA CONTA? SE SIM, APERTE QUALQUER TECLA PARA CONTINUAR");
    await keypress();

    const algodToken =
      "";
    const algodServer = "https://mainnet-api.algonode.network"; //para testnet: "https://testnet-api.algonode.network"
    const algodPort = 443;

    let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

    const { assetID } = await createAsset(algodClient, creator);
  } catch (err) {
    console.log("err", err);
  }
  process.exit();
}
createNFT();