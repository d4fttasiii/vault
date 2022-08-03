import { createApp } from 'vue';
import { createPinia } from 'pinia';
import SolanaWallets from 'solana-wallets-vue';

import 'solana-wallets-vue/styles.css';

import App from './App.vue';
import  './index.css';
import router from './router';

import {
    PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';

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

