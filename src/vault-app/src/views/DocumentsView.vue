<script setup>

import axios from 'axios'
import { useAnchorWallet } from 'solana-wallets-vue'
import { ref, onBeforeMount, computed, reactive } from 'vue'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { utils, Program, AnchorProvider, BN } from '@project-serum/anchor';
import { useJwtStore } from '../stores/jwt';

import * as VAULT_IDL from '../idl/vault.json'

const jwtStore = useJwtStore();
const wallet = ref(useAnchorWallet());
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment: "confirmed" }));
const program = computed(() => new Program(VAULT_IDL, new PublicKey(VAULT_IDL.metadata.address), provider.value));

let documents = ref([]);
const data = reactive({
    invitee: ''
})

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

const getProfileDocumentSharePda = async (
    documentPda,
    invitee
) => {
    const [pda, _] = await PublicKey.findProgramAddress(
        [
            documentPda.toBuffer(),
            utils.bytes.utf8.encode('vault-document-share'),
            invitee.toBuffer(),
        ],
        program.value.programId
    );

    return pda;
};

const loadDocuments = async () => {
    try {
        const token = jwtStore.$state.token;
        const { data } = await axios.get(
            `http://localhost:3000/api/v1/document/list`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(data);
        documents.value = []
        Array.from(data).forEach(d => documents.value.push(d))
    }
    catch (error) {
        console.error(error);
    }
}

const downloadDocument = async (doc) => {
    try {
        const token = jwtStore.$state.token;
        const url = `http://localhost:3000/api/v1/document/${wallet.value.publicKey.toBase58()}/${doc.index}`;
        const { data } = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            responseType: 'blob'
        });
        const x = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = x;
        link.setAttribute('download', doc.metadata.name); //or any other extension
        document.body.appendChild(link);
        link.click();
    }
    catch (error) {
        console.error(error);
    }
}

const deleteDocument = async (doc) => {
    try {
        const token = jwtStore.$state.token;
        const url = `http://localhost:3000/api/v1/document/${wallet.value.publicKey.toBase58()}/${doc.index}`;
        await axios.delete(url, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
    }
    catch (error) {
        console.error(error);
    }
}


const shareDocument = async (doc) => {
    const profileDocumentPda = await getProfileDocumentPda(wallet.value.publicKey, doc.index)
    const profileDocumentSharePda = await getProfileDocumentSharePda(
        profileDocumentPda,
        new PublicKey(data.invitee),
    )

    await program.value.methods
        .createProfileDocumentShare(new BN(doc.index), new PublicKey(data.invitee), new BN(8))
        .accounts({
            profile: wallet.value.publicKey,
            document: profileDocumentPda,
            documentShare: profileDocumentSharePda,
        })
        .rpc();
}

onBeforeMount(() => {
    if (jwtStore.isLoggedIn) {
        loadDocuments()
    }
    else {
        alert('Please connect your wallet first!')
    }
})

</script>

<template>
    <main>
        <h1 class="text-3xl font-bold underline">Documents</h1>
        <div class="my-5">
            <label class="block text-sm font-bold mb-2" for="invitee">Invitee</label>
            <input
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="invitee" type="text" v-model="data.invitee" />
        </div>
        <div class="flex mt-10">
            <table class="border-collapse table-auto w-100 text-sm">
                <thead class="border-b">
                    <tr>
                        <th
                            class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                            Nr.</th>
                        <th
                            class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                            Name</th>
                        <th
                            class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                            Uploaded At</th>
                        <th
                            class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                            Size</th>
                        <th
                            class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-slate-800">
                    <tr v-for="doc in documents" :key="doc._id">
                        <td
                            class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                            {{ doc.index }}</td>
                        <td
                            class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                            {{ doc.metadata.name }}</td>
                        <td
                            class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                            {{ doc.createdAt }}</td>
                        <td
                            class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                            {{ doc.metadata.size }}</td>
                        <td
                            class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                            <div class="flex">
                                <button class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-2 mx-2"
                                    @click="() => downloadDocument(doc)">
                                    <font-awesome-icon icon="fa-solid fa-download"></font-awesome-icon>
                                </button>
                                <button class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-2 mx-2"
                                    @click="() => shareDocument(doc)">
                                    <font-awesome-icon icon="fa-solid fa-share"></font-awesome-icon>
                                </button>
                                <button class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-2 mx-2"
                                    @click="() => deleteDocument(doc)">
                                    <font-awesome-icon icon="fa-solid fa-circle-xmark" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </main>
</template>
