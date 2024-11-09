<template>
  <div
    class="bg-grey-5 video-sized row justify-center items-center relative-position"
    :style="{ maxWidth: maxWidthHeight, maxHeight: maxWidthHeight }"
  >
    <canvas
      ref="canvasElement"
      class="video-sized absolute-top-left"
      :style="{ maxWidth: maxWidthHeight, maxHeight: maxWidthHeight }"
    ></canvas>
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
        {{ internalErrorMessage }}
      </div>
    </div>
  </div>

  <BaseQrScannerPermissions
    :model-value="waitWithPermissionRequest"
    @update:model-value="waitWithPermissionRequest = false"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useInterval, useQuasar, useTimeout } from 'quasar';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import init, { read_qrcodes_from_image_data } from 'quircs-wasm';
import wasmUrl from 'quircs-wasm/quircs_wasm_bg.wasm?url';
import BaseQrScannerPermissions from 'src/components/Base/BaseQrScanner/BaseQrScannerPermissions.vue';

const READY_TIMEOUT_MS = 15 * 1000;

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
  maxWidthHeight?: string;
}>();

const canvasElement = ref<HTMLCanvasElement | null>(null);

defineExpose({
  focus: () =>
    canvasElement.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    }),
});

await init(wasmUrl);

const $q = useQuasar();

const cameraPermission = await navigator.permissions
  // @ts-expect-error: firefox doesn't know about 'camera', the others do
  // https://searchfox.org/mozilla-central/source/dom/webidl/Permissions.webidl#10
  .query({ name: 'camera' })
  .then((result) => result.state)
  .catch(() => null);

const waitWithPermissionRequest = ref(
  !!(
    cameraPermission === 'prompt' &&
    $q.platform.is.ios &&
    // not needed on iOS standalone mode (PWA)
    (!('standalone' in navigator) || !navigator.standalone)
  ),
);
watch(waitWithPermissionRequest, (v) => {
  if (!v) {
    initVideo();
  }
});

const internalErrorMessage = ref('');

const { t } = useI18n();

const video = document.createElement('video');
video.setAttribute('playsinline', ''); // no fullscreen (iOS)

const videoAccess = ref(false);
const loading = ref(true);
let videoStream: MediaStream;
let animationFrame: number | null = null;

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
  if (!waitWithPermissionRequest.value) {
    initVideo();
  }
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
    if (
      e instanceof DOMException &&
      ['NotAllowedError', 'NotFoundError'].includes(e.name)
    ) {
      internalErrorMessage.value = [
        t('base.qr.permissionRequest'),
        $q.platform.is.mac && t('base.qr.permissionHintMac'),
      ]
        .filter(Boolean)
        .join(' ');
      videoAccess.value = false;
      return;
    }

    internalErrorMessage.value =
      e instanceof Error ? e.message : 'Unknown error';

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
const { registerTimeout, removeTimeout } = useTimeout();
async function canvasAndVideoAreReady() {
  return new Promise((resolve, reject) => {
    registerTimeout(() => {
      reject(new Error('Timeout waiting for video and canvas to be ready'));
    }, READY_TIMEOUT_MS);
    registerInterval(() => {
      if (canvasElement.value && video.readyState === video.HAVE_ENOUGH_DATA) {
        removeInterval();
        removeTimeout();
        resolve(true);
      }
    }, 25);
  });
}
onBeforeUnmount(() => {
  removeInterval();
  removeTimeout();
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

    const res = read_qrcodes_from_image_data(imageData, true);
    for (let qr of res) {
      if ('content' in qr.data) {
        drawFrameAroundCode({
          topLeftCorner: qr.corners[0],
          topRightCorner: qr.corners[1],
          bottomRightCorner: qr.corners[2],
          bottomLeftCorner: qr.corners[3],
        });
        emit(
          'change',
          String.fromCharCode.apply(null, qr.data.content.payload),
        );
      }
    }
  }

  animationFrame = requestAnimationFrame(processVideoFrame);
}

function drawFrameAroundCode(location: {
  topLeftCorner: Point;
  topRightCorner: Point;
  bottomRightCorner: Point;
  bottomLeftCorner: Point;
}) {
  const frameColor = '#FF3B58';
  drawLine(location.topLeftCorner, location.topRightCorner, frameColor);
  drawLine(location.topRightCorner, location.bottomRightCorner, frameColor);
  drawLine(location.bottomRightCorner, location.bottomLeftCorner, frameColor);
  drawLine(location.bottomLeftCorner, location.topLeftCorner, frameColor);
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
