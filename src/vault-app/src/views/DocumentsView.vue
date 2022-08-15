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
        <h1>Documents</h1>
        <button @click="loadDocuments">Reload</button>
        <div class="documents">
            <table class="table-auto">
                <thead>
                    <tr>
                        <th>Nr.</th>
                        <th>Name</th>
                        <th>Uploaded At</th>
                        <th>Size</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="doc in documents" :key="doc._id">
                        <td>{{ doc.index }}</td>
                        <td>{{ doc.metadata.name }}</td>
                        <td>{{ doc.createdAt }}</td>
                        <td>{{ doc.metadata.size }}</td>
                        <td>
                            <div class="flex">
                                <button class="rounded-full">
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </main>
</template>
