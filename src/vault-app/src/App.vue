<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { WalletMultiButton, useAnchorWallet, useWallet } from 'solana-wallets-vue'
import { watch, reactive } from 'vue'
import axios from 'axios'
import { useJwtStore } from './stores/jwt';

const anchorWallet = useAnchorWallet();
const solanaWallet = reactive(useWallet());
const jwtStore = useJwtStore();

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
  if (isConnected) {
    await login(solanaWallet.publicKey.toBase58());
  }
})

watch(() => jwtStore.isLoggedIn, (isLoggedIn, _) => {
  if (!isLoggedIn) {
    jwtStore.reset()
  }
})

</script>

<template>
  <header>
    <nav class="flex items-center justify-between flex-wrap bg-gray-900 text-gray-100 p-4">
      <RouterLink class="hover:text-gray-300" to="/">Profile</RouterLink>
      <RouterLink class="hover:text-gray-300" to="/shared">Shared</RouterLink>
      <RouterLink class="hover:text-gray-300" to="/upload">Upload</RouterLink>
      <RouterLink class="hover:text-gray-300" to="/documents">Documents</RouterLink>
      <WalletMultiButton :dark="true"></WalletMultiButton>
    </nav>
  </header>
  <div class="h-screen p-4 bg-gray-800 text-white">
    <RouterView />
  </div>
</template>
