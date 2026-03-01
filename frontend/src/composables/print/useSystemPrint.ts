import { onBeforeUnmount } from 'vue';
import {
  PRINT_SERVICE_TYPE_SYSTEM,
  type UsePrintResultCommon,
} from './usePrint';

const PASSTHROUGH_MARKER_TEMPLATE = '${%s}$';

export function useSystemPrint(): UsePrintResultCommon & {
  type: typeof PRINT_SERVICE_TYPE_SYSTEM;
} {
  let frame: HTMLIFrameElement | null = null;

  function removeFrame() {
    if (frame) {
      document.body.removeChild(frame);
      frame = null;
    }
  }

  function print(str: string) {
    if (frame) document.body.removeChild(frame);
    const content =
      encodeURIComponent('<html><head>') +
      '%3Cscript%3E' + // script tag. vue parser fails if not encoded here
      encodeURIComponent(
        // !!! DO NOT CHANGE !!!
        // or you will have to adapt the CSP hash
        // see dev-nginx.conf AND deployment repo
        'window.onload = () => { console.info("print", document.body.textContent); window.print(); }',
      ) +
      '%3C%2Fscript%3E' + // /script tag. vue parser fails if not encoded here
      encodeURIComponent('</head><body>') +
      encodeURIComponent(wrapPassthroughMarker(str)) +
      encodeURIComponent('</body></html>');
    frame = document.body.appendChild(document.createElement('iframe'));
    frame.style.display = 'none';
    frame.src = 'data:text/html;charset=utf-8,' + content;
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        removeFrame();
        resolve();
      }, 1000);
    });
  }

  onBeforeUnmount(removeFrame);

  return {
    type: PRINT_SERVICE_TYPE_SYSTEM,
    print,
  };
}

function wrapPassthroughMarker(str: string) {
  return PASSTHROUGH_MARKER_TEMPLATE.replace('%s', str);
}
