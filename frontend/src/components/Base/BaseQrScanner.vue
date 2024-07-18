<template>
  <div
    class="bg-grey-5 video-sized row justify-center items-center relative-position"
  >
    <canvas ref="canvasElement" class="video-sized absolute-top-left"></canvas>
    <div class="absolute q-pa-sm">
      <div
        v-if="error && errorMessage"
        class="text-center text-negative text-weight-bold q-pa-md"
        style="
          background: rgba(0, 0, 0, 0.5);
          -webkit-text-stroke: max(0.05em, 0.5px);
          -webkit-text-stroke-color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.015em;
        "
      >
        {{ errorMessage }}
      </div>
      <BaseSpinner v-else-if="loading" size="xl" />
      <div v-else-if="!videoAccess" class="text-center text-negative">
        <q-icon name="no_photography" size="2em" /><br />
        {{ t('base.qr.permissionRequest') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import jsQR, { QRCode } from 'jsqr';
import { useI18n } from 'src/composables/useI18n';
import { useInterval } from 'quasar';
import BaseSpinner from './BaseSpinner.vue';

interface Point {
  x: number;
  y: number;
}

const emit = defineEmits<{
  change: [data: string];
  ready: [];
}>();

defineProps<{
  errorMessage?: string;
  error?: boolean;
}>();

const { t } = useI18n();

const video = document.createElement('video');
video.setAttribute('playsinline', ''); // no fullscreen (iOS)

const videoAccess = ref(false);
const loading = ref(true);
let videoStream: MediaStream;
let animationFrame: number | null = null;

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
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});

async function initVideo() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 640 },
        aspectRatio: { ideal: 1 },
      },
    });

    videoAccess.value = true;

    video.srcObject = videoStream;

    await videoMetadataLoaded();
    video.play();

    await canvasAndVideoAreReady();
    emit('ready');

    animationFrame = requestAnimationFrame(processVideoFrame);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'NotAllowedError') {
      videoAccess.value = false;
      return;
    }

    videoAccess.value = false;
    console.error(e);
    throw e; // so it's reported by sentry
  } finally {
    loading.value = false;
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

function processVideoFrame() {
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
      drawFrameAroundCode(code);
      emit('change', code.data);
    }
  }

  animationFrame = requestAnimationFrame(processVideoFrame);
}

function drawFrameAroundCode(code: QRCode) {
  const frameColor = '#FF3B58';
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
}

function drawLine(begin: Point, end: Point, color: string) {
  renderingContext.beginPath();
  renderingContext.moveTo(begin.x, begin.y);
  renderingContext.lineTo(end.x, end.y);
  renderingContext.lineWidth = 4;
  renderingContext.strokeStyle = color;
  renderingContext.stroke();
}
</script>

<style scoped>
.video-sized {
  width: clamp(250px, min(calc(100svh - 400px), calc(100svw - 64px)), 800px);
  height: clamp(250px, min(calc(100svh - 400px), calc(100svw - 64px)), 800px);
}
</style>
