<template>EDIT: {{ entityId }} {{ typeof entityId }}</template>

<script setup lang="ts">
defineProps<{ entityId: number | string }>();
</script>
