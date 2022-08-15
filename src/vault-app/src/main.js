import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import SolanaWallets from 'solana-wallets-vue';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import './assets/main.css'
import 'solana-wallets-vue/styles.css';

const walletOptions = {
    wallets: [
        new PhantomWalletAdapter(),
    ],
    autoConnect: true,
};
const app = createApp(App)
app.use(SolanaWallets, walletOptions);
app.use(createPinia())
app.use(router)

app.mount('#app')