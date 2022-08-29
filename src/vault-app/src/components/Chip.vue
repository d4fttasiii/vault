<script setup>

import dayjs from 'dayjs';

const props = defineProps({
    date: {
        type: Date,
    }
})

const formatDate = (dateString) => {
    const date = dayjs(dateString);
    return date.format('DD.MM.YYYY HH:mm:ss');
}

</script>
    
<template>
    <span class="px-2 py-2 rounded-full text-gray-500 bg-gray-200 text-xs flex align-middle" v-if="date">
        <slot></slot>
        {{  formatDate(date)  }}
    </span>
</template>