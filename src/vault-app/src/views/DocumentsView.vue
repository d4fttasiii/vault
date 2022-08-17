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

    try {
        await program.value.methods
            .createProfileDocumentShare(new BN(doc.index), new PublicKey(data.invitee), new BN(8))
            .accounts({
                profile: wallet.value.publicKey,
                document: profileDocumentPda,
                documentShare: profileDocumentSharePda,
            })
            .rpc();

    } catch {

    }

    const token = jwtStore.$state.token;
    await axios.post('http://localhost:3000/api/v1/share', {
        walletAddress: doc.profileWalletAddress,
        index: doc.index,
        inviteeAddress: data.invitee,
        sharePda: profileDocumentSharePda.toBase58(),
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    })
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
        <div class="mt-10 w-full">
            <div class="inline-block w-full shadow-md rounded-lg overflow-hidden">
                <table class="w-full leading-normal">
                    <thead>
                        <tr>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Nr.
                            </th>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Metadata
                            </th>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Created At / Updated At
                            </th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="doc in documents" :key="doc._id">
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <p class="text-gray-900 whitespace-no-wrap">
                                    {{ doc.index }}
                                </p>
                            </td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <p class="text-gray-900 whitespace-no-wrap">{{ doc.metadata.name }}</p>
                                <p class="text-gray-600 whitespace-no-wrap">{{ doc.metadata.size / 1000 }} KB</p>
                            </td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <p class="text-gray-900 whitespace-no-wrap">{{ doc.createdAt }}</p>
                                <p class="text-gray-900 whitespace-no-wrap">{{ doc.updatedAt }}</p>
                            </td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                <div class="flex">
                                    <button class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-1 px-2 mx-2"
                                        @click="() => downloadDocument(doc)">
                                        <font-awesome-icon icon="fa-solid fa-download"></font-awesome-icon>
                                    </button>
                                    <button class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-1 px-2 mx-2"
                                        @click="() => shareDocument(doc)">
                                        <font-awesome-icon icon="fa-solid fa-share"></font-awesome-icon>
                                    </button>
                                    <button class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-1 px-2 mx-2"
                                        @click="() => deleteDocument(doc)">
                                        <font-awesome-icon icon="fa-solid fa-circle-xmark" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</template>
