<script setup>

import axios from 'axios'
import { useAnchorWallet, useWallet } from 'solana-wallets-vue'
import { ref, reactive, computed } from 'vue'
import { useJwtStore } from '../stores/jwt';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { utils, Program, AnchorProvider } from '@project-serum/anchor';

import * as VAULT_IDL from '../idl/vault.json'

const jwtStore = useJwtStore();
const wallet = ref(useAnchorWallet());
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment: "confirmed" }));
const program = computed(() => new Program(VAULT_IDL, new PublicKey(VAULT_IDL.metadata.address), provider.value));
const data = reactive({
  file: '',
  uploadPercentage: 0,
});

const handleFileUpload = (event) => {
  data.file = event.target.files[0];
}

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

const getProfileDocumentPda = async (address, docCount) => {
  const [pda, _] = await PublicKey
    .findProgramAddress(
      [
        utils.bytes.utf8.encode('vault-document'),
        address.toBuffer(),
        utils.bytes.utf8.encode(docCount.toString()),
      ],
      program.value.programId
    );

  return pda;
};

const getNextDocumentIndex = async () => {
  try {
    const token = jwtStore.$state.token;
    const { data } = await axios.get(
      `http://localhost:3000/api/v1/document/list`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return data.length;
  }
  catch (error) {
    console.error(error);
  }
}

const uploadDocument = async () => {
  const token = jwtStore.$state.token;
  const latestDocumentIndex = await getNextDocumentIndex();
  const profilePda = await getProfilePda(wallet.value.publicKey);
  const profileDocumentPda = await getProfileDocumentPda(wallet.value.publicKey, latestDocumentIndex);

  try {
    await program.value.methods
      .createProfileDocument(data.file.name)
      .accounts({
        profile: wallet.value.publicKey,
        profileData: profilePda,
        document: profileDocumentPda
      })
      .rpc();
  }
  catch (error) {
    console.error(error);
  }

  let formData = new FormData();
  formData.append('file', data.file);
  await axios.post('http://localhost:3000/api/v1/document/',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        data.uploadPercentage = parseInt(Math.round((progressEvent.loaded / progressEvent.total) * 100));
      }
    }
  )
}

</script>

<template>
  <main>
    <h1 class="text-3xl font-bold underline">Upload</h1>
    <div class="flex mt-10">
      <input
        class="block w-full text-lg text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 mr-5"
        id="file" type="file" @change="handleFileUpload" />

      <button class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-1 px-2" v-on:click="uploadDocument()">
        <font-awesome-icon icon="fa-solid fa-upload" />
      </button>
    </div>
  </main>
</template>
