import Clipboard from "clipboard";
export default function handleClipboard(text, event) {
  const clipboard = new Clipboard(event.target, {
    text: () => text,
  });
  clipboard.on("success", (e) => {
    clipboard.destroy();
  });
  clipboard.on("error", (e) => {
    clipboard.destroy();
  });
  // ClipboardJS binds DOM click handlers in its constructor; this helper is
  // called from an existing click event, so invoke the internal handler only
  // through a narrow compatibility cast for the installed library version.
  (clipboard as Clipboard & { onClick: (event: Event) => void }).onClick(event);
}
