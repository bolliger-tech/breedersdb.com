export function focusInView(focusable: {
  focus: () => void;
  $el: HTMLElement;
}) {
  focusable.focus();
  focusable.$el.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
}
