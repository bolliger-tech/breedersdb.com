<template>
  <div class="row items-center">
    <q-icon
      :name="propsWithDefaults.icon"
      :color="propsWithDefaults.iconColor"
      text-color="white"
      :size="propsWithDefaults.iconSize"
      class="col-auto"
      style="margin-right: 0.33em"
    />
    <div
      class="col"
      :class="{
        [`text-${propsWithDefaults.messageColor}`]:
          !!propsWithDefaults.messageColor,
      }"
    >
      <slot>{{ message }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NamedColor, QIconProps } from 'quasar';
import { type Slot, computed } from 'vue';

export interface BaseWarningProps {
  type: 'warning' | 'error' | 'success' | 'info';
  icon?: QIconProps['name'];
  iconColor?: QIconProps['color'];
  iconSize?: QIconProps['size'];
  message?: string;
  messageColor?: NamedColor;
}

const props = defineProps<BaseWarningProps>();
defineSlots<{ default: Slot }>();

type Defaults = {
  [x in BaseWarningProps['type']]: Omit<BaseWarningProps, 'type'>;
};

const defaults: Defaults = {
  warning: {
    icon: 'warning',
    iconColor: 'warning',
  },
  error: {
    icon: 'error',
    iconColor: 'negative',
  },
  success: {
    icon: 'check',
    iconColor: 'positive',
  },
  info: {
    icon: 'info',
  },
};

const propsWithDefaults = computed(() => {
  const propsWithValues = Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  );

  return {
    ...{ iconSize: '1.2em' },
    ...defaults[props.type],
    ...propsWithValues,
  };
});
</script>
