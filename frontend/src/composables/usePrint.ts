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
        'window.onload = () => { console.info("print", document.body.textContent); window.print(); }',
      ) +
      '%3C%2Fscript%3E' + // /script tag. vue parser fails if not encoded here
      encodeURIComponent('</head><body>') +
      encodeURIComponent(str) +
      encodeURIComponent('</body></html>');
    frame = document.body.appendChild(document.createElement('iframe'));
    frame.style.display = 'none';
    frame.src = 'data:text/html;charset=utf-8,' + content;
    window.setTimeout(removeFrame, 1000);
  }

  onBeforeUnmount(removeFrame);

  return {
    print,
  };
}
