<script setup>

import axios from 'axios'
import { ref, onBeforeMount } from 'vue'
import { useJwtStore } from '../stores/jwt';


const jwtStore = useJwtStore();
let documents = ref([]);

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
        <button class="my-5" @click="loadDocuments">Reload</button>
        <div class="flex">
            <table class="border-collapse table-auto w-100 text-sm">
                <thead class="border-b">
                    <tr>
                        <th
                            class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                            Nr.</th>
                        <th  class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">Name</th>
                        <th  class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">Uploaded At</th>
                        <th  class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">Size</th>
                        <th  class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"></th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-slate-800">
                    <tr v-for="doc in documents" :key="doc._id">
                        <td class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">{{ doc.index }}</td>
                        <td class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">{{ doc.metadata.name }}</td>
                        <td class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">{{ doc.createdAt }}</td>
                        <td class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">{{ doc.metadata.size }}</td>
                        <td class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                            <div class="flex">
                                <button class="rounded-full mr-2">
                                    Download
                                </button>
                                <button class="rounded-full mr-2">
                                    Share
                                </button>
                                <button class="rounded-full">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </main>
</template>
