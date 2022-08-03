<script setup lang="ts">
import { ref, computed, watchEffect, defineComponent } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { WalletMultiButton, useAnchorWallet, useWallet } from 'solana-wallets-vue';
import { Connection, PublicKey, Keypair, clusterApiUrl, SystemProgram } from '@solana/web3.js';
import { utils, Program, AnchorProvider } from '@project-serum/anchor';
import axios from 'axios';

import * as VAULT_IDL from './idl/vault.json';

let practitionerAddress: string = 'i1nVV2hL5rdyLrpLLqaaRmDeWJ91cjQmm3v5YWV379A';

const wallet = useAnchorWallet();
const w = useWallet();
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment: "confirmed" }));
const program = computed(() => new Program(PATIENT_DOCUMENT_ACCESS_IDL, new PublicKey(PATIENT_DOCUMENT_ACCESS_IDL.metadata.address), provider.value));

const login = async () => {
    try {
        const url = `http://localhost:3000/api/v1/profile/${wallet.value.publicKey.toBase58()}/login-message`;
        const res = await axios.get(url);
        const message = res.data;
        console.log(message);
        const signature = await w.signMessage.value(Buffer.from(message, 'utf-8'));
        console.log(Buffer.from(signature.subarray(0, 64)).toString('hex'));
    } catch (error) {
        console.log(error);
    }
};

const approveRequest = async () => {
    if (!wallet.value) {
        return alert('Connect your wallet first.')
    }

    const docAccessPda = await getPatientDocumentAccessPda(wallet.value.publicKey, practitionerAddress);

    // await program.rpc.approveAccessRequest(new PublicKey(practitionerAddress), {
    //   accounts: {
    //     patient: wallet.value.publicKey,
    //     documentAccess: docAccessPda,
    //   },
    //   signers: [wallet.value]
    // })

    await program.value.methods
        .approveAccessRequest(new PublicKey(practitionerAddress))
        .accounts({
            patient: wallet.value.publicKey,
            documentAccess: docAccessPda,
        })
        .rpc();

};

const declineRequest = async () => {
    if (!wallet.value) {
        return alert('Connect your wallet first.')
    }
    const docAccessPda = await getPatientDocumentAccessPda(wallet.value.publicKey, practitionerAddress);

    await program.value.methods
        .declineAccessRequest(new PublicKey(practitionerAddress))
        .accounts({
            patient: wallet.value.publicKey,
            documentAccess: docAccessPda,
        })
        .rpc();
};

const getPatientDocumentAccessPda = async (patientWalletAddress: string, practitionerWalletAddress: string) => {
    const [pda, _] = await PublicKey
        .findProgramAddress(
            [
                utils.bytes.utf8.encode('patient-document-access'),
                new PublicKey(practitionerWalletAddress).toBuffer(),
                new PublicKey(patientWalletAddress).toBuffer(),
            ],
            program.value.programId
        );

    return pda;
};
</script>

<template>
    <div class="bg-indigo-600">
        <nav class="
                        container
                        px-6
                        py-8
                        mx-auto
                        md:flex md:justify-between md:items-center
                      ">
            <div class="flex items-center justify-between">
                <router-link to="/" class="
                            text-xl
                            font-bold
                            text-gray-100
                            md:text-2xl
                            flex
                          ">Vault
                </router-link>
                <!-- Mobile menu button -->
                <div @click="toggleNav" class="flex md:hidden">
                    <button type="button" class="
                              text-gray-100
                              hover:text-gray-400
                              focus:outline-none focus:text-gray-400
                            ">
                            <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current">
                              <path
                                fill-rule="evenodd"
                                d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                              ></path>
                            </svg>
                          </button>
                </div>
            </div>
    
            <!-- Mobile Menu open: "block", Menu closed: "hidden" -->
            <ul :class="showMenu ? 'flex' : 'hidden'" class="
                          flex-col
                          mt-8
                          space-y-4
                          md:flex md:space-y-0 md:flex-row md:items-center md:space-x-10 md:mt-0
                        ">
                <li class="text-gray-100 hover:text-indigo-400">Home</li>
                <li class="text-gray-100 hover:text-indigo-400">About</li>
                <li class="text-gray-100 hover:text-indigo-400">Blogs</li>
                <li class="text-gray-100 hover:text-indigo-400">
                    <wallet-multi-button :dark="true"></wallet-multi-button>
                </li>
            </ul>
        </nav>
    </div>
    <div class="h-screen w-screen flex bg-gray-900 text-gray-100">
    
        <div class="m-auto w-full max-w-md p-8">
            <div class="shadow-xl rounded-xl bg-gray-700">
                <div class="p-8 text-center">
                    <p class="uppercase text-xs tracking-widest text-gray-400 font-semibold">Patient Document Access</p>
                    <p class="font-bold text-5xl mt-2 text-white"></p>
                </div>
                <div>
                    <label>Practitioner</label>
                    <input class="focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none w-full text-sm text-slate-900 placeholder-slate-400 rounded-md py-2 pl-4 ring-1 ring-slate-200 shadow-sm" type="text" placeholder="Practitioner Address" v-model="practitionerAddress"
                    />
                </div>
                <div class="flex">
                    <button class="flex-1 py-4 px-2 rounded-bl-xl hover:bg-gray-800" @click="login">Login</button>
                    <button class="flex-1 py-4 px-2 rounded-br-xl hover:bg-gray-800" @click="approveRequest">Approve Request</button>
                </div>
            </div>
    
            <div class="text-sm mt-8">
                <p class="text-xs font-semibold text-gray-400">Wallet address:</p>
                <p>{{ $wallet.publicKey.value?.toBase58() ?? 'Not connected' }}</p>
                <p class="text-xs font-semibold text-gray-400 mt-4">Program Address:</p>
                <p>{{ VAULT_IDL.metadata.address ?? 'Not created' }}</p>
            </div>
    
        </div>
    
    </div>
</template>
