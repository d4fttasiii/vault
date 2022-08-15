<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { WalletMultiButton, useAnchorWallet, useWallet } from 'solana-wallets-vue'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { AnchorProvider } from '@project-serum/anchor'
import { watch , computed, reactive } from 'vue'
import axios from 'axios'
import { useJwtStore } from './stores/jwt';

const anchorWallet = useAnchorWallet();
const solanaWallet = reactive(useWallet());
const jwtStore = useJwtStore();
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const provider = computed(
  () =>
    new AnchorProvider(connection, wallet.value, {
      preflightCommitment: "confirmed",
    })
);
const program = computed(
  () =>
    new Program(
      PATIENT_DOCUMENT_ACCESS_IDL,
      new PublicKey(PATIENT_DOCUMENT_ACCESS_IDL.metadata.address),
      provider.value
    )
);

const login = async (address) => {
  if (!anchorWallet.value) {
    return alert("Connect your wallet first.");
  }
  try {
    const { data } = await axios.get(
      `http://localhost:3000/api/v1/profile/${address}/login-message`
    );
    const signature = await solanaWallet.signMessage(
      Buffer.from(data, "utf-8")
    );
    const res = await axios.post("http://localhost:3000/api/v1/profile/login", {
      walletAddress: address,
      signature: signature,
    });
    jwtStore.set(res.data.access_token);
  } catch (error) {
    console.log(error);
    jwtStore.reset();
  } 
}

watch(() => solanaWallet.connected, async (isConnected, _) => {
  if(isConnected){
    await login(solanaWallet.publicKey.toBase58());
  }
})

</script>

<template>
  <header>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/documents">Documents</RouterLink>
      </nav>
    <WalletMultiButton :dark="true"></WalletMultiButton>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

</style>
