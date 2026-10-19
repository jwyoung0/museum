export function createDrawer({
    element,
    closeButton,
    initialFocus,
    canClose
}) {
    let previouslyFocusedElement = null;

    function open() {
        if (!element.hidden) {
            return;
        }

        previouslyFocusedElement =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        element.hidden = false;
        element.setAttribute("aria-hidden", "false");

        initialFocus()?.focus();
    }

    function close() {
        if (element.hidden || !canClose()) {
            return;
        }

        element.hidden = true;
        element.setAttribute("aria-hidden", "true");

        previouslyFocusedElement?.focus();
        previouslyFocusedElement = null;
    }

    closeButton.addEventListener("click", close);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !element.hidden) {
            close();
        }
    });

    return {
        open,
        close,
        isOpen: () => !element.hidden
    };
}
