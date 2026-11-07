export function runDialog(dialog, values = {}) {
	const form = dialog.querySelector("form");
	const opener = document.activeElement;
	form.reset();
	for (const [name, value] of Object.entries(values)) form.elements[name].value = value;
	dialog.returnValue = "";
	dialog.showModal();
	return new Promise((resolve) => {
		dialog.addEventListener("close", () => {
			const data = dialog.returnValue === "save" ? new FormData(form) : null;
			form.reset();
			opener?.focus();
			resolve(data);
		}, { once: true });
	});
}

document.addEventListener("click", (event) => {
	const button = event.target.closest("[data-close]");
	if (button) button.closest("dialog").close("cancel");
});
