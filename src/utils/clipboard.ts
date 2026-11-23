/**
 * Copies text to the clipboard with fallback support for non-secure HTTP contexts and native apps.
 *
 * Modern browsers restrict `navigator.clipboard` to Secure Contexts (HTTPS and localhost).
 * When running over plain HTTP on LAN IP addresses or non-localhost origins,
 * the fallback `document.execCommand('copy')` is used so copying still succeeds.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	// 1. Capacitor native app support
	try {
		const { Capacitor } = await import("@capacitor/core");
		if (Capacitor?.isNativePlatform?.()) {
			const { Clipboard } = await import("@capacitor/clipboard");
			await Clipboard.write({ string: text });
			return true;
		}
	} catch {
		// Ignore Capacitor errors and fall back to browser clipboard
	}

	// 2. Modern navigator.clipboard if available (secure context: HTTPS or localhost)
	if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fallback to execCommand if clipboard API rejected (e.g. lack of focus or permission)
		}
	}

	// 3. Fallback to document.execCommand('copy') for unsecure contexts (e.g. plain HTTP on LAN IP)
	if (typeof document !== "undefined") {
		try {
			const textArea = document.createElement("textarea");
			textArea.value = text;
			textArea.style.position = "fixed";
			textArea.style.top = "0";
			textArea.style.left = "0";
			textArea.style.width = "2em";
			textArea.style.height = "2em";
			textArea.style.padding = "0";
			textArea.style.border = "none";
			textArea.style.outline = "none";
			textArea.style.boxShadow = "none";
			textArea.style.background = "transparent";
			textArea.setAttribute("readonly", "");
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			textArea.setSelectionRange(0, text.length);
			const successful = document.execCommand("copy");
			document.body.removeChild(textArea);
			return !!successful;
		} catch {
			return false;
		}
	}

	return false;
}
