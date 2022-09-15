import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  Connection,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  PublicKey
} from "@solana/web3.js";

import {
  createTransferCheckedInstruction, createTransferInstruction, getOrCreateAssociatedTokenAccount
} from "@solana/spl-token"

import PhantomWallet from "./PhantomWallet";

const NETWORK = "devnet";


export default function App() {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [target, setTarget] = useState("")
  const connection = new Connection(clusterApiUrl(NETWORK));
  const phantomWallet = useRef(new PhantomWallet(NETWORK)).current;
  const addLog = useCallback((log: string) => {
    setLogs((logs) => [...logs, "> " + log]);
    console.log(log);
  }, []);
  const scrollViewRef = useRef<any>(null);

  const sendSolTx = async () => {
    return new Promise<Transaction>(async (resolve, reject) => {
      const phantomWalletPublicKey = phantomWallet.getWalletPublicKey();
      if (!phantomWalletPublicKey) {
        reject('Not connected to a wallet');
        return;
      }
      let targetAddress = new PublicKey(target);
      let transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: phantomWalletPublicKey,
          toPubkey: targetAddress,
          lamports: 1000000000,
        })
      );
      transaction.feePayer = phantomWalletPublicKey;
      addLog('Getting recent blockhash');
      const anyTransaction: any = transaction;
      anyTransaction.recentBlockhash = (await connection.getLatestBlockhash().catch(err => reject(err))).blockhash;
      resolve(transaction);
    });
  }

  const sendSPLTx = async () => {
    // return new Promise<Transaction>(async (resolve, reject) => {
    //   const phantomWalletPublicKey = phantomWallet.getWalletPublicKey();
    //   if (!phantomWalletPublicKey) {
    //     reject('Not connected to a wallet');
    //     return;
    //   }

    //   const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    //     connection,
    //     phantomWalletPublicKey,
    //     new PublicKey("5Aepq44hW3NTfGQQsr9M65EF9EKZA9WyiNUMSpFwznhr"),
    //     phantomWalletPublicKey,
    //     signTransaction // Don't pass that if you have the private key as a string
    //   );

    //   let targetAddress = new PublicKey(target);
    //   let txs = new Transaction().add(
    //     createTransferInstruction( // imported from '@solana/spl-token'
    //         fromTokenAccount.address,
    //         toTokenAccount.address,
    //         fromPublicKey,
    //         parseInt(amount * Math.pow(10, 6)), // tokens have 6 decimals of precision so your amount needs to have the same
    //         [],
    //         TOKEN_PROGRAM_ID // imported from '@solana/spl-token'
    //     )
    // );
    //   // let transaction = new Transaction().add(
    //   //   createTransferCheckedInstruction(
    //   //     phantomWalletPublicKey,
    //   //     new PublicKey("5Aepq44hW3NTfGQQsr9M65EF9EKZA9WyiNUMSpFwznhr"),
    //   //     targetAddress,

    //   //   )
    //   // );
    //   transaction.feePayer = phantomWalletPublicKey;
    //   addLog('Getting recent blockhash');
    //   const anyTransaction: any = transaction;
    //   anyTransaction.recentBlockhash = (await connection.getLatestBlockhash().catch(err => reject(err))).blockhash;
    //   resolve(transaction);
    // });
  }

  const createTransferTransaction = async () => {
    return new Promise<Transaction>(async (resolve, reject) => {
      const phantomWalletPublicKey = phantomWallet.getWalletPublicKey();
      if (!phantomWalletPublicKey) {
        reject('Not connected to a wallet');
        return;
      }

      let transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: phantomWalletPublicKey,
          toPubkey: phantomWalletPublicKey,
          lamports: 100,
        })
      );
      transaction.feePayer = phantomWalletPublicKey;
      addLog('Getting recent blockhash');
      const anyTransaction: any = transaction;
      anyTransaction.recentBlockhash = (await connection.getLatestBlockhash().catch(err => reject(err))).blockhash;
      resolve(transaction);
    });
  };

  const connect = async () => {
    addLog('Connecting...');
    phantomWallet
      .connect()
      .then(() => {
        addLog('connected!');
        setConnected(true)
      })
      .catch(error => addLog(error));
  };

  const disconnect = async () => {
    addLog('Disconnecting...');
    phantomWallet
      .disconnect()
      .then(() => addLog('disconnected!'))
      .catch(error => addLog(error));
  };

  const signAndSendTransaction = async () => {
    const transaction = await createTransferTransaction()
      .catch(err => {
        addLog(err)
      });

    if (!transaction)
      return;

    addLog('Signing and sending transaction...');

    phantomWallet
      .signAndSendTransaction(transaction, false)
      .then((t) => addLog(`signAndSendTransaction result: ${JSON.stringify(t)}`))
      .catch(error => addLog(error));
  };

  const sendSOL = async () => {
    if (target == "") {
      addLog("Add a target address")
    } else {
      const transaction = await sendSolTx().catch(err => {
        addLog(err)
      });
      if (!transaction)
        return;

      addLog('Signing and sending transaction...');

      phantomWallet
        .signAndSendTransaction(transaction, false)
        .then((t) => addLog(`Send SOL result: ${JSON.stringify(t)}`))
        .catch(error => addLog(error));
    }
  }

  const sendSPL = async() => {
    if (target == "") {
      addLog("Add a target address")
    } else {
      const transaction = await sendSolTx().catch(err => {
        addLog(err)
      });
      if (!transaction)
        return;

      addLog('Signing and sending transaction...');

    }
  }

  const signAllTransactions = async () => {
    const transactions = await Promise.all([
      createTransferTransaction(),
      createTransferTransaction(),
    ])
      .catch(err => addLog(err));

    if (!transactions)
      return;

    addLog('Signing multiple transactions...');

    phantomWallet
      .signAllTransactions(transactions, false)
      .then(ts => {
        ts.map(t => {
          addLog(`transaction: ${JSON.stringify(t)}`);
        })
      })
      .catch(error => addLog(error));
  };

  const signTransaction = async () => {
    addLog('Signing transaction...');
    const transaction = await createTransferTransaction()
      .catch(addLog);

    if (!transaction)
      return;


    phantomWallet
      .signTransaction(transaction, false)
      .then(t => addLog(`signed transaction: ${JSON.stringify(t)}`))
      .catch(error => addLog(error));
  };

  const signMessage = async () => {
    const message = "To avoid digital dognappers, sign below to authenticate with CryptoCorgis.";
    addLog('Signing message...');

    phantomWallet
      .signMessage(message)
      .then((transaction) => addLog(`signed message: ${JSON.stringify(transaction)}`))
      .catch(error => addLog(error))
  };

  const wallet = phantomWallet.getWalletPublicKey()?.toBase58();
  let connectButton;

    if (!connected) {
      connectButton = (
        <Btn title="Connect" onPress={connect} />
      )
    } else {
      connectButton = (
        <Btn title="Disconnect" onPress={disconnect} />
      )
    }




return (
  <View style={{ flex: 1, backgroundColor: "#333" }}>
    <StatusBar style="light" />
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          backgroundColor: "#111",
          padding: 20,
          paddingTop: 100,
          flexGrow: 1,
        }}
        ref={scrollViewRef}
        onContentSizeChange={() => {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }}
        style={{ flex: 1 }}
      >
        {logs.map((log, i) => (
          <Text
            key={`t-${i}`}
            style={{
              fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
              color: "#fff",
              fontSize: 14,
            }}
          >
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
    <View style={{ flex: 0, paddingTop: 20, paddingBottom: 40 }}>
      <Text style={{ textAlign: "center", color: "white"}}>{wallet}</Text>
      <TextInput style={{ "borderColor": "white", "borderWidth": 2, "color": "white", "textAlign": "center" }} onChangeText={setTarget} value={target} />
      {connectButton}
      <Btn title="Send Token" onPress={sendSOL} />
      <Btn title="Sign And Send Transaction" onPress={signAndSendTransaction} />
      <Btn title="Sign All Transactions" onPress={signAllTransactions} />
      <Btn title="Sign Transaction" onPress={signTransaction} />
      <Btn title="Sign Message" onPress={signMessage} />

    </View>
  </View>
);
}

const Btn = ({ title, onPress }: { title: string; onPress: () => Promise<void> }) => {
  return (
    <View style={{ marginVertical: 10 }}>
      <Button title={title} onPress={onPress} />
    </View>
  );
};
