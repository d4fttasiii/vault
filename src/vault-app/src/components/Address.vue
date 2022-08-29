<script setup>

const props = defineProps({
    address: {
        type: String,
        default: '',
    }
})

const formatAddress = (addrString) => {
    if (!addrString) {
        return '';
    }
    return `${addrString.substring(0, 6)}...${addrString.substring(addrString.length - 6)}`;
}

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
}

</script>
        
<template>
    <span class="text-gray-900 whitespace-no-wrap" v-if="address">
        <span class="mr-1 font-medium">{{  formatAddress(address)  }}</span>
        <font-awesome-icon icon="fa-solid fa-copy" class="text-blue-900 hover:text-blue-600 cursor-pointer"
            @click="() => copyToClipboard(address)" />
    </span>
</template>