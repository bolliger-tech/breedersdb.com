<template>
  <PageLayout>
    <ExamplePlantsList />
  </PageLayout>
  <router-view name="modal" />
</template>

<script setup lang="ts">
import ExamplePlantsList from 'src/components/ExamplePlantsList.vue';
import PageLayout from 'src/layouts/PageLayout.vue';
</script>
