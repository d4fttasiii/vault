<script setup>

import axios from 'axios'
import { useJwtStore } from '../stores/jwt';
import { ref, onBeforeMount, watch } from 'vue'

const jwtStore = useJwtStore();
let shares = ref([]);

const loadShared = async () => {
    try {
        const token = jwtStore.$state.token;
        const { data } = await axios.get(
            `http://localhost:3000/api/v1/share/list`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(data);
        shares.value = []
        Array.from(data).forEach(d => shares.value.push(d))
    }
    catch (error) {
        console.error(error);
    }
}

const downloadDocument = async (share) => {
    try {
        const token = jwtStore.$state.token;
        const url = `http://localhost:3000/api/v1/document/${share.ownerAddress}/${share.index}`;
        const { data } = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            responseType: 'blob'
        });
        const x = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = x;
        link.setAttribute('download', share.filename);
        document.body.appendChild(link);
        link.click();
    }
    catch (error) {
        console.error(error);
        alert(error.message)
    }
}

onBeforeMount(() => {
    if (jwtStore.isLoggedIn) {
        loadShared()
    }
    else {
        alert('Please connect your wallet first!')
    }
})

watch(() => jwtStore.isLoggedIn, (isLoggedIn, _) => {
  if (isLoggedIn) {
    loadShared()
  }
})

</script>

<template>
    <main>
        <h1 class="text-3xl font-bold underline">Shared</h1>
        <div class="flex mt-10">
            <div class="inline-block min-w-full shadow-md rounded-lg overflow-hidden">
                <table class="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Owner Address / Share PDA
                            </th>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Metadata
                            </th>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Issued / Due
                            </th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="share in shares" :key="share._id">
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <div class="flex">
                                    <div class="ml-3">
                                        <p class="text-gray-900 whitespace-no-wrap font-mono">
                                            {{ share.ownerAddress }}
                                        </p>
                                        <p class="text-gray-600 whitespace-no-wrap font-mono">{{ share.sharePda }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <p class="text-gray-900 whitespace-no-wrap">{{ share.filename }}</p>
                                <p class="text-gray-600 whitespace-no-wrap">{{ share.size / 1000 }} KB</p>
                            </td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <p class="text-gray-900 whitespace-no-wrap">{{ share.updatedAt }}</p>
                                <p class="text-gray-600 whitespace-no-wrap">{{ share.validUntil }}</p>
                            </td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                <button class="rounded-full bg-blue-800 text-white hover:bg-blue-600 p-1 px-2 mx-2"
                                    @click="() => downloadDocument(share)">
                                    <font-awesome-icon icon="fa-solid fa-download"></font-awesome-icon>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</template>
