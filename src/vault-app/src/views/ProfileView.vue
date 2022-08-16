<script setup>

import axios from 'axios'
import { useAnchorWallet, useWallet } from 'solana-wallets-vue'
import { ref, reactive, computed, watch } from 'vue'
import { useJwtStore } from '../stores/jwt';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { utils, Program, AnchorProvider } from '@project-serum/anchor';

import * as VAULT_IDL from '../idl/vault.json'

const jwtStore = useJwtStore();
const wallet = ref(useAnchorWallet());
const solanaWallet = reactive(useWallet());
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment: "confirmed" }));
const program = computed(() => new Program(VAULT_IDL, new PublicKey(VAULT_IDL.metadata.address), provider.value));
const data = reactive({
  walletAddress: '',
  pda: '',
  pdaExists: false,
})

const getProfilePda = async (walletAddress) => {
  const [pda, _] = await PublicKey
    .findProgramAddress(
      [
        utils.bytes.utf8.encode('vault-profile'),
        new PublicKey(walletAddress).toBuffer(),
      ],
      program.value.programId
    );

  return pda;
};

const createProfile = async () => {
  if (!wallet.value) {
    return alert('Connect your wallet first.')
  }

  const profilePda = new PublicKey(data.pda);
  try {
    await program.value.methods
      .createProfile()
      .accounts({
        profile: wallet.value.publicKey,
        profileData: profilePda,
      })
      .rpc();
  } catch (error) {
    console.error(error)
  }

  await axios.post('http://localhost:3000/api/v1/profile', {
    walletAddress: wallet.value.publicKey.toBase58(),
    profileAddress: data.pda,
  })
}

watch(() => solanaWallet.connected, async (isConnected, _) => {
  if (isConnected) {
    const pda = await getProfilePda(solanaWallet.publicKey);
    data.pda = pda.toBase58();
    data.walletAddress = solanaWallet.publicKey.toBase58();
    data.pdaExists = !!(await connection.getAccountInfo(pda));
  }
})

</script>

<template>
  <main>
    <h1 class="text-3xl font-bold underline">Profile</h1>
    <div class="flex mt-10">
      <ul>
        <li>Connected Wallet: {{ data.walletAddress || 'Wallet not connected!' }}</li>
        <li>
          <span>Profile Address: {{ data.pda || 'Wallet not connected!' }}</span>
          <button class="rounded-full bg-blue-800 text-white p-2 mx-2"
            :class="{ 'hover:bg-blue-600': !(data.pda && data.pdaExists) }" @click="createProfile">
            <font-awesome-icon icon="fa-solid fa-plus" />
          </button>
        </li>
      </ul>
    </div>
  </main>
</template>
