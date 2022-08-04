import './index.css';
import 'solana-wallets-vue/styles.css';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { createPinia } from 'pinia';
import SolanaWallets from 'solana-wallets-vue';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

const walletOptions = {
    wallets: [
        new PhantomWalletAdapter(),
    ],
    autoConnect: true,
};

createApp(App)
    .use(SolanaWallets, walletOptions)
    .use(createPinia())
    .use(router)
    .mount('#app');