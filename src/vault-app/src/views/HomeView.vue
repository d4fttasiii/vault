<script setup lang="ts">

import { ref, computed, watchEffect, defineComponent, reactive } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { WalletMultiButton, useAnchorWallet, useWallet } from "solana-wallets-vue";
import {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
  SystemProgram,
} from "@solana/web3.js";
import { utils, Program, AnchorProvider } from "@project-serum/anchor";
import axios from "axios";
import * as VAULT_IDL from "../idl/vault.json";

const states = reactive({
  loading: false,
  loggedIn: false
});

const anchorWallet = useAnchorWallet();
const solanaWallet = useWallet();
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const provider = computed(
  () => new AnchorProvider(connection, wallet.value, { preflightCommitment: "confirmed" })
);
const program = computed(
  () =>
    new Program(
      VAULT_IDL,
      new PublicKey(VAULT_IDL.metadata.address),
      provider.value
    )
);

const login = async () => {
  if (!anchorWallet.value) {
    return alert("Connect your wallet first.");
  }
  try {
    states.loading = true;
    const { data } = await axios.get(`http://localhost:3000/api/v1/profile/${anchorWallet.value.publicKey.toBase58()}/login-message`);
    const signature = await solanaWallet.signMessage.value(Buffer.from(data, "utf-8"));
    const res = await axios.post('http://localhost:3000/api/v1/profile/login', {
      walletAddress: anchorWallet.value.publicKey.toBase58(),
      signature: signature
    });
    states.loggedIn = true;
  } catch (error) {
    console.log(error);
    states.loggedIn = false;
  }
  finally {
    states.loading = false;
  }
};
</script>

<template>
  <main>
    <div class="h-screen w-screen flex bg-gray-900 text-gray-100">
      <div class="m-auto w-full max-w-md p-8">
        <div class="shadow-xl rounded-xl bg-gray-700">          
          <div class="flex">
            <div v-if="!states.loggedIn">
              <button class="flex-1 py-4 px-2 rounded-bl-xl hover:animate-pulse" @click="login">
                <span>Login</span>
              </button>
            </div>
            <div v-else>
              <button class="flex-1 py-4 px-2 rounded-bl-xl hover:animate-pulse" @click="login">
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div class="text-sm mt-8">
          <p class="text-xs font-semibold text-gray-400">Wallet address:</p>
          <p>{{ $wallet.publicKey.value?.toBase58() ?? "Not connected" }}</p>
          <p class="text-xs font-semibold text-gray-400 mt-4">Program Address:</p>
          <p>{{ VAULT_IDL.metadata.address ?? "Not created" }}</p>
        </div>
      </div>
    </div>
  </main>
</template>
