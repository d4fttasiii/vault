<script setup>

import axios from 'axios'
import { useAnchorWallet } from 'solana-wallets-vue'
import { ref, onBeforeMount, computed, reactive, watch } from 'vue'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { utils, Program, AnchorProvider, BN } from '@project-serum/anchor'
import { useJwtStore } from '../stores/jwt'
import Chip from '../components/Chip.vue'
import Address from '../components/Address.vue'

import * as VAULT_IDL from '../idl/vault.json'

const jwtStore = useJwtStore();
const wallet = ref(useAnchorWallet());
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment: "confirmed" }));
const program = computed(() => new Program(VAULT_IDL, new PublicKey(VAULT_IDL.metadata.address), provider.value));

let documents = ref([]);
const data = reactive({
    invitee: '',
    shareHours: 8,
    details: undefined
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
            .createProfileDocumentShare(new BN(doc.index), new PublicKey(data.invitee), new BN(data.shareHours))
            .accounts({
                profile: wallet.value.publicKey,
                document: profileDocumentPda,
                documentShare: profileDocumentSharePda,
            })
            .rpc();

    } catch { }

    const token = jwtStore.$state.token;
    await axios.post('http://localhost:3000/api/v1/share', {
        walletAddress: doc.profileAddress,
        index: doc.index,
        inviteeAddress: data.invitee,
        sharePda: profileDocumentSharePda.toBase58(),
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    })
}

const showDetails = async (doc) => {
    data.details = doc
    documents.value.forEach(d => d.detailsShown = false)
    doc.detailsShown = true
}

const toggleDocumentEncryption = async (doc) => {
    try {
        const token = jwtStore.$state.token;
        const url = `http://localhost:3000/api/v1/document/${doc.index}/encryption`;
        await axios.put(url, { key: 'k3y' }, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
    }
    catch (error) {
        console.error(error);
    }
}

onBeforeMount(() => {
    if (jwtStore.isLoggedIn) {
        loadDocuments()
    }
    else {
        alert('Please connect your wallet first!')
    }
})

watch(() => jwtStore.isLoggedIn, (isLoggedIn, _) => {
    if (isLoggedIn) {
        loadDocuments()
    }
})

</script>

<template>
    <main>
        <h1 class="text-3xl font-bold underline">Documents</h1>
        <div class="flex my-5">
            <div class="mr-2">
                <label class="block text-sm font-bold mb-2" for="invitee">Invitee</label>
                <input
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="invitee" type="text" v-model="data.invitee" />
            </div>
            <div class="mx-2">
                <label class="block text-sm font-bold mb-2" for="invitee">TTL (Hours)</label>
                <input
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="shareHours" type="number" v-model="data.shareHours" />
            </div>
        </div>
        <div class="mt-10 w-full">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-7 rounded-lg overflow-hidden">
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
                            <tr v-for="(doc, index) in documents" :key="doc._id">
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p class="text-gray-900 whitespace-no-wrap">
                                        {{  index + 1  }}
                                    </p>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p class="text-gray-900 whitespace-no-wrap">{{  doc.metadata.name  }}</p>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p class="text-gray-900 whitespace-no-wrap">{{  doc.createdAt  }}</p>
                                    <p class="text-gray-900 whitespace-no-wrap">{{  doc.updatedAt  }}</p>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                    <div class="flex">
                                        <button
                                            class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-1 px-2 ml-1"
                                            @click="() => downloadDocument(doc)">
                                            <font-awesome-icon icon="fa-solid fa-download"></font-awesome-icon>
                                        </button>
                                        <button
                                            class="rounded-full bg-blue-600 text-white hover:bg-blue-400 p-1 px-2 mx-1"
                                            :class="{ 'bg-blue-400': doc.detailsShown }" @click="() => showDetails(doc)"
                                            :disabled="doc.detailsShown">
                                            <font-awesome-icon icon="fa-solid fa-right-to-bracket" />
                                        </button>
                                        <!-- <button
                                            class="rounded-full bg-red-800 text-white hover:bg-blue-600 p-1 px-2 mx-2"
                                            @click="() => deleteDocument(doc)">
                                            <font-awesome-icon icon="fa-solid fa-circle-xmark" />
                                        </button> -->
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-span-5">
                    <div class="max-w-sm bg-white rounded-lg border shadow-md border-gray-200 bg-gray-100"
                        v-if="data.details">
                        <!-- <a href="#">
                            <img class="rounded-t-lg" src="/docs/images/blog/image-1.jpg" alt="" />
                        </a> -->
                        <div class="p-3">
                            <div class="grid grid-cols-12 gap-2">
                                <div class="col-span-8">
                                    <h5 class="font-bold tracking-tight text-gray-700">
                                        {{  data.details.metadata.name  }}
                                    </h5>
                                    <p class="mb-3 font-normal text-gray-700 text-sm dark:text-gray-400">
                                        {{  data.details.metadata.size / 1000  }} KB
                                    </p>
                                </div>
                                <div class="col-span-4">
                                    <div class="flex">
                                        <button
                                            class="rounded-full bg-red-800 text-white hover:bg-red-600 p-1 px-2 mr-1"
                                            @click="() => deleteDocument(data.details)">
                                            <font-awesome-icon icon="fa-solid fa-circle-xmark" />
                                        </button>
                                        <button
                                            class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-1 px-2 mx-1"
                                            @click="() => shareDocument(doc)">
                                            <font-awesome-icon icon="fa-solid fa-share"></font-awesome-icon>
                                        </button>
                                        <button
                                            class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-1 px-2 mx-1"
                                            @click="() => toggleDocumentEncryption(data.details)">
                                            <font-awesome-icon v-if="data.details.isEncrypted" icon="fa-solid fa-lock">
                                            </font-awesome-icon>
                                            <font-awesome-icon v-if="!data.details.isEncrypted"
                                                icon="fa-solid fa-lock-open"></font-awesome-icon>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>

                            </div>
                            <div>
                                <h5 class="text-gray-700">Shares</h5>
                                <div v-for="(share, index) in data.details.shares"
                                    :key="share.sharePda">
                                    <Address :address="share.sharePda"></Address>
                                    <div class="flex mt-1">
                                        <Chip :date="share.updatedAt" class="mr-1">
                                            <font-awesome-icon icon="fa-solid fa-pen-to-square" class="fa-lg mr-1" />
                                        </Chip>
                                        <Chip :date="share.validUntil">
                                            <font-awesome-icon icon="fa-solid fa-clock" class="fa-lg mr-1" />
                                        </Chip>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
