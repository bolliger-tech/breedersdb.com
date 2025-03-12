import { onBeforeUnmount } from 'vue';

export function usePrint() {
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
      encodeURIComponent(str) +
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
    print,
  };
}
