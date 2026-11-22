<template>
  <q-dialog v-model="open" :full-width="$q.screen.xs">
    <q-card class="cultivar-pedigree-dialog">
      <q-card-section>
        <div class="row items-center no-wrap q-mb-md">
          <h3 class="col q-my-none">{{ t('cultivars.pedigree.title') }}</h3>
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
            :aria-label="t('base.close')"
          />
        </div>

        <!-- QDialog mounts its content on each opening, so each loads afresh.
          Following an ancestor's link closes the dialog, as the route change
          remounts the view modal. -->
        <CultivarPedigreeChart
          :cultivar-id="cultivarId"
          :display-name="displayName"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import CultivarPedigreeChart from './CultivarPedigreeChart.vue';

defineProps<{ cultivarId: number; displayName: string }>();
const open = defineModel<boolean>({ required: true });

const { t } = useI18n();
</script>

<style lang="scss" scoped>
// Quasar caps dialogs at 560px. The chart may use the whole screen width.
.cultivar-pedigree-dialog {
  max-width: 100%;
}
</style>
