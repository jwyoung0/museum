export function createFormState(form) {
    let initialState = "";

    function getCurrentState() {
        return JSON.stringify(Object.fromEntries(new FormData(form)));
    }

    function capture() {
        initialState = getCurrentState();
    }

    function isDirty() {
        return getCurrentState() !== initialState;
    }

    function confirmDiscard() {
        return !isDirty() || window.confirm("Discard unsaved changes?");
    }

    return { capture, isDirty, confirmDiscard };
}
