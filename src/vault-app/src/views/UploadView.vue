<script setup>
;
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

  await program.value.methods
    .createProfileDocument(data.file.name)
    .accounts({
      profile: wallet.value.publicKey,
      profileData: profilePda,
      document: profileDocumentPda
    })
    .rpc();

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
      <div class="large-12 medium-12 small-12 cell">
        <label>File
          <input type="file" id="file" ref="file" @change="handleFileUpload" />
        </label>
        <br />
        <progress max="100" :value.prop="data.uploadPercentage"></progress>
        <br />
        <button v-on:click="uploadDocument()">Upload</button>
      </div>
    </div>
  </main>
</template>
