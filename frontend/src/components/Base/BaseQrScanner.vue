<template>
  <div
    class="bg-grey-5 video-sized row justify-center items-center relative-position"
  >
    <div v-if="!videoAccess" class="text-center text-negative q-pa-sm">
      <q-icon name="no_photography" size="2em" /><br />
      {{ t('base.qr.permissionRequest') }}
    </div>
    <BaseSpinner v-else-if="loading" />
    <canvas ref="canvasElement" class="video-sized absolute-top-left"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import jsQR from 'jsqr';
import { useI18n } from 'src/composables/useI18n';
import { useInterval } from 'quasar';
import BaseSpinner from './BaseSpinner.vue';

interface Point {
  x: number;
  y: number;
}

const frameColor = '#FF3B58';

const emit = defineEmits<{
  change: [data: string];
  ready: [];
}>();

const { t } = useI18n();

const video = document.createElement('video');
const videoAccess = ref(false);
const loading = ref(true);
let videoStream: MediaStream;

const canvasElement = ref<HTMLCanvasElement | null>(null);
let renderingContext: CanvasRenderingContext2D;

onMounted(() => {
  const context = canvasElement.value?.getContext('2d', {
    willReadFrequently: true,
  });
  if (context) {
    renderingContext = context;
  } else {
    throw new Error('Failed to get canvas context');
  }
  initVideo();
});

onBeforeUnmount(() => {
  if (videoStream) {
    videoStream.getTracks().forEach(function (track) {
      track.stop();
    });
  }
});

function drawLine(begin: Point, end: Point, color: string) {
  renderingContext.beginPath();
  renderingContext.moveTo(begin.x, begin.y);
  renderingContext.lineTo(end.x, end.y);
  renderingContext.lineWidth = 4;
  renderingContext.strokeStyle = color;
  renderingContext.stroke();
}

async function initVideo() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 800 },
        height: { ideal: 800 },
        frameRate: { ideal: 10 },
      },
    });

    video.setAttribute('playsinline', ''); // tell safari on iOS we don't want fullscreen
    video.srcObject = videoStream;
    videoAccess.value = true;

    await videoMetadataLoaded();
    video.play();

    await canvasAndVideoAreReady();
    loading.value = false;

    requestAnimationFrame(tick);
  } catch (e) {
    console.error(e);
    videoAccess.value = false;
  }
}

async function videoMetadataLoaded() {
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(true);
    };
  });
}

const { registerInterval, removeInterval } = useInterval();
async function canvasAndVideoAreReady() {
  return new Promise((resolve) => {
    registerInterval(() => {
      if (canvasElement.value && video.readyState === video.HAVE_ENOUGH_DATA) {
        removeInterval();
        resolve(true);
      }
    }, 25);
  });
}
onBeforeUnmount(() => {
  removeInterval();
});

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const el = canvasElement.value;

    if (!el) {
      // this should never happen
      throw new Error('Canvas element not found');
    }

    let dx = 0,
      dy = 0,
      dw = 0,
      dh = 0;
    if (video.videoWidth > video.videoHeight) {
      dx = (video.videoWidth - video.videoHeight) / 2;
      dw = video.videoHeight;
      dh = video.videoHeight;
    } else {
      dy = (video.videoHeight - video.videoWidth) / 2;
      dw = video.videoWidth;
      dh = video.videoWidth;
    }
    el.width = dw;
    el.height = dh;

    renderingContext.drawImage(
      video,
      dx,
      dy,
      dw,
      dh,
      0,
      0,
      el.width,
      el.height,
    );
    const imageData = renderingContext.getImageData(0, 0, el.width, el.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      drawLine(
        code.location.topLeftCorner,
        code.location.topRightCorner,
        frameColor,
      );
      drawLine(
        code.location.topRightCorner,
        code.location.bottomRightCorner,
        frameColor,
      );
      drawLine(
        code.location.bottomRightCorner,
        code.location.bottomLeftCorner,
        frameColor,
      );
      drawLine(
        code.location.bottomLeftCorner,
        code.location.topLeftCorner,
        frameColor,
      );
      emit('change', code.data);
    }
  }

  requestAnimationFrame(tick);
}

watch(loading, (val) => {
  if (!val) {
    emit('ready');
  }
});
</script>

<style scoped>
.video-sized {
  width: clamp(250px, min(calc(100svh - 400px), calc(100svw - 100px)), 800px);
  height: clamp(250px, min(calc(100svh - 400px), calc(100svw - 100px)), 800px);
}
</style>
