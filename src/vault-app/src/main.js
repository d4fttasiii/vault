import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import SolanaWallets from 'solana-wallets-vue';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from '@fortawesome/free-solid-svg-icons'
library.add(fas);
import { fab } from '@fortawesome/free-brands-svg-icons';
library.add(fab);
import { far } from '@fortawesome/free-regular-svg-icons';
library.add(far);
import { dom } from "@fortawesome/fontawesome-svg-core";
dom.watch();

import 'solana-wallets-vue/styles.css';
import './index.css'

const walletOptions = {
    wallets: [
        new PhantomWalletAdapter(),
    ],
    autoConnect: true,
};
const app = createApp(App)

app.component("font-awesome-icon", FontAwesomeIcon);

app.use(SolanaWallets, walletOptions)
app.use(createPinia())
app.use(router)

app.mount('#app')