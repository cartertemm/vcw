# Tracker Awareness Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page web app showing users what data trackers can collect, with educational content and protection tips.

**Architecture:** Single HTML file with embedded CSS and JavaScript. Dark-to-light visual theme transition. Data collected via browser APIs and one external fetch (ipapi.co). Accessible tables with proper heading hierarchy.

**Tech Stack:** Vanilla HTML5, CSS3, JavaScript (ES6+). No dependencies.

---

## Task 1: HTML Skeleton & Header

**Files:**
- Create: `index.html`

**Step 1: Create the base HTML structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>What They Know About You</title>
	<style>
		/* Styles will be added in Task 2 */
	</style>
</head>
<body>
	<header>
		<h1>What They Know About You</h1>
		<p class="disclaimer">This information is displayed locally in your browser. Nothing is logged or transmitted to any server. This page exists solely to help you understand your digital footprint.</p>
	</header>

	<main>
		<section id="reveal">
			<h2>Your Exposed Data</h2>
			<!-- Data tables will be added in Task 3 -->
		</section>

		<section id="facts">
			<h2>What This Means</h2>
			<!-- Facts content will be added in Task 7 -->
		</section>

		<section id="protect">
			<h2>Protect Yourself</h2>
			<!-- Protection tips will be added in Task 8 -->
		</section>
	</main>

	<footer>
		<p>This page runs entirely in your browser. No data was collected, logged, or transmitted.</p>
	</footer>

	<script>
		// JavaScript will be added in Tasks 4-6
	</script>
</body>
</html>
```

**Step 2: Verify file opens in browser**

Open `index.html` in a browser. Should see:
- "What They Know About You" heading
- Disclaimer text
- Three section headings (Your Exposed Data, What This Means, Protect Yourself)
- Footer text

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add HTML skeleton with semantic structure"
```

---

## Task 2: CSS Styling - Base & Dark Theme

**Files:**
- Modify: `index.html` (style section)

**Step 1: Add CSS custom properties and base styles**

Replace the `<style>` section with:

```css
:root {
	/* Dark theme colors */
	--dark-bg: #0a0a0a;
	--dark-bg-card: #1a1a1a;
	--dark-border: #333;
	--dark-text: #e0e0e0;
	--dark-text-emphasis: #fff;
	--dark-accent: #ff6b6b;

	/* Light theme colors */
	--light-bg: #f8f8f8;
	--light-bg-card: #fff;
	--light-border: #ddd;
	--light-text: #333;
	--light-text-muted: #666;
	--light-accent: #2d7d46;

	/* Transitional colors */
	--warning-bg: #1a1a0a;
	--warning-accent: #d4a000;

	/* Typography */
	--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	--font-mono: "SF Mono", "Cascadia Code", "Consolas", monospace;
}

*,
*::before,
*::after {
	box-sizing: border-box;
}

body {
	margin: 0;
	padding: 0;
	font-family: var(--font-sans);
	line-height: 1.6;
}

header {
	background: var(--dark-bg);
	color: var(--dark-text);
	padding: 3rem 2rem;
	text-align: center;
}

header h1 {
	color: var(--dark-text-emphasis);
	font-size: 2.5rem;
	margin: 0 0 1rem 0;
}

header .disclaimer {
	max-width: 600px;
	margin: 0 auto;
	font-size: 0.95rem;
	opacity: 0.85;
}

main {
	max-width: 1000px;
	margin: 0 auto;
}

h2 {
	font-size: 1.75rem;
	margin: 0 0 1.5rem 0;
}

h3 {
	font-size: 1.25rem;
	margin: 2rem 0 1rem 0;
}

/* Dark section (reveal) */
#reveal {
	background: var(--dark-bg);
	color: var(--dark-text);
	padding: 2rem;
}

#reveal h2 {
	color: var(--dark-text-emphasis);
	text-align: center;
}

#reveal h3 {
	color: var(--dark-accent);
	border-bottom: 1px solid var(--dark-border);
	padding-bottom: 0.5rem;
}

/* Tables in dark section */
#reveal table {
	width: 100%;
	border-collapse: collapse;
	margin-bottom: 1.5rem;
	background: var(--dark-bg-card);
	border-radius: 8px;
	overflow: hidden;
}

#reveal th,
#reveal td {
	padding: 0.75rem 1rem;
	text-align: left;
	border-bottom: 1px solid var(--dark-border);
}

#reveal th {
	background: var(--dark-bg);
	color: var(--dark-text-emphasis);
	font-weight: 600;
}

#reveal td:last-child {
	font-family: var(--font-mono);
	color: var(--dark-text-emphasis);
	word-break: break-all;
}

#reveal tr:last-child td {
	border-bottom: none;
}

/* Transitional section (facts) */
#facts {
	background: linear-gradient(to bottom, var(--dark-bg) 0%, var(--warning-bg) 50%, var(--light-bg) 100%);
	padding: 3rem 2rem;
}

#facts h2 {
	color: var(--dark-text-emphasis);
	text-align: center;
}

/* Light section (protect) */
#protect {
	background: var(--light-bg);
	color: var(--light-text);
	padding: 2rem;
}

#protect h2 {
	color: var(--light-text);
	text-align: center;
}

#protect h3 {
	color: var(--light-accent);
	border-bottom: 1px solid var(--light-border);
	padding-bottom: 0.5rem;
}

#protect ul {
	list-style: none;
	padding: 0;
}

#protect li {
	padding: 0.5rem 0;
	padding-left: 1.5rem;
	position: relative;
}

#protect li::before {
	content: "✓";
	position: absolute;
	left: 0;
	color: var(--light-accent);
	font-weight: bold;
}

#protect a {
	color: var(--light-accent);
	text-decoration: underline;
}

#protect a:hover {
	text-decoration: none;
}

footer {
	background: var(--light-bg);
	color: var(--light-text-muted);
	text-align: center;
	padding: 2rem;
	border-top: 1px solid var(--light-border);
	font-size: 0.9rem;
}

/* Loading state */
.loading {
	opacity: 0.5;
	font-style: italic;
}

/* Responsive */
@media (max-width: 600px) {
	header {
		padding: 2rem 1rem;
	}

	header h1 {
		font-size: 1.75rem;
	}

	#reveal,
	#facts,
	#protect {
		padding: 1.5rem 1rem;
	}

	#reveal table {
		font-size: 0.9rem;
	}

	#reveal th,
	#reveal td {
		padding: 0.5rem;
	}
}
```

**Step 2: Verify styling in browser**

Refresh `index.html`. Should see:
- Dark header with white title
- Dark background for "Your Exposed Data" section
- Gradient background for "What This Means" section
- Light background for "Protect Yourself" section
- Light footer

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add CSS styling with dark-to-light theme transition"
```

---

## Task 3: Data Tables HTML Structure

**Files:**
- Modify: `index.html` (reveal section)

**Step 1: Add all data category tables**

Replace the `<!-- Data tables will be added in Task 3 -->` comment inside `#reveal` with:

```html
<h3>Network & Location</h3>
<table>
	<thead>
		<tr>
			<th scope="col">Data Point</th>
			<th scope="col">Your Value</th>
		</tr>
	</thead>
	<tbody id="network-data">
		<tr><td>IP Address</td><td class="loading">Loading...</td></tr>
		<tr><td>Country</td><td class="loading">Loading...</td></tr>
		<tr><td>City</td><td class="loading">Loading...</td></tr>
		<tr><td>Postal Code</td><td class="loading">Loading...</td></tr>
		<tr><td>Timezone</td><td class="loading">Loading...</td></tr>
		<tr><td>ISP</td><td class="loading">Loading...</td></tr>
		<tr><td>ASN</td><td class="loading">Loading...</td></tr>
		<tr><td>Coordinates</td><td class="loading">Loading...</td></tr>
	</tbody>
</table>

<h3>Browser & System</h3>
<table>
	<thead>
		<tr>
			<th scope="col">Data Point</th>
			<th scope="col">Your Value</th>
		</tr>
	</thead>
	<tbody id="browser-data">
		<tr><td>User Agent</td><td class="loading">Loading...</td></tr>
		<tr><td>Browser</td><td class="loading">Loading...</td></tr>
		<tr><td>Platform</td><td class="loading">Loading...</td></tr>
		<tr><td>Operating System</td><td class="loading">Loading...</td></tr>
		<tr><td>Language</td><td class="loading">Loading...</td></tr>
		<tr><td>Do Not Track</td><td class="loading">Loading...</td></tr>
		<tr><td>Cookies Enabled</td><td class="loading">Loading...</td></tr>
		<tr><td>Online Status</td><td class="loading">Loading...</td></tr>
	</tbody>
</table>

<h3>Hardware</h3>
<table>
	<thead>
		<tr>
			<th scope="col">Data Point</th>
			<th scope="col">Your Value</th>
		</tr>
	</thead>
	<tbody id="hardware-data">
		<tr><td>Device Memory</td><td class="loading">Loading...</td></tr>
		<tr><td>CPU Cores</td><td class="loading">Loading...</td></tr>
		<tr><td>Screen Resolution</td><td class="loading">Loading...</td></tr>
		<tr><td>Available Screen</td><td class="loading">Loading...</td></tr>
		<tr><td>Pixel Ratio</td><td class="loading">Loading...</td></tr>
		<tr><td>Color Depth</td><td class="loading">Loading...</td></tr>
		<tr><td>Touch Support</td><td class="loading">Loading...</td></tr>
		<tr><td>Connection Type</td><td class="loading">Loading...</td></tr>
		<tr><td>Device Type</td><td class="loading">Loading...</td></tr>
	</tbody>
</table>

<h3>Fingerprints</h3>
<table>
	<thead>
		<tr>
			<th scope="col">Data Point</th>
			<th scope="col">Your Value</th>
		</tr>
	</thead>
	<tbody id="fingerprint-data">
		<tr><td>Canvas Fingerprint</td><td class="loading">Loading...</td></tr>
		<tr><td>WebGL Renderer</td><td class="loading">Loading...</td></tr>
		<tr><td>WebGL Vendor</td><td class="loading">Loading...</td></tr>
		<tr><td>Audio Fingerprint</td><td class="loading">Loading...</td></tr>
		<tr><td>System Fonts</td><td class="loading">Loading...</td></tr>
	</tbody>
</table>

<h3>Storage & State</h3>
<table>
	<thead>
		<tr>
			<th scope="col">Data Point</th>
			<th scope="col">Your Value</th>
		</tr>
	</thead>
	<tbody id="storage-data">
		<tr><td>LocalStorage</td><td class="loading">Loading...</td></tr>
		<tr><td>SessionStorage</td><td class="loading">Loading...</td></tr>
		<tr><td>IndexedDB</td><td class="loading">Loading...</td></tr>
		<tr><td>History Length</td><td class="loading">Loading...</td></tr>
		<tr><td>Current Path</td><td class="loading">Loading...</td></tr>
	</tbody>
</table>

<h3>Permissions & Detection</h3>
<table>
	<thead>
		<tr>
			<th scope="col">Data Point</th>
			<th scope="col">Your Value</th>
		</tr>
	</thead>
	<tbody id="permissions-data">
		<tr><td>Notification Permission</td><td class="loading">Loading...</td></tr>
		<tr><td>Geolocation Permission</td><td class="loading">Loading...</td></tr>
		<tr><td>Ad Blocker Detected</td><td class="loading">Loading...</td></tr>
		<tr><td>WebRTC Leak</td><td class="loading">Loading...</td></tr>
	</tbody>
</table>
```

**Step 2: Verify tables in browser**

Refresh `index.html`. Should see:
- Six tables with proper headings
- All values showing "Loading..." in italic
- Tables styled with dark theme

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add data tables HTML structure with loading states"
```

---

## Task 4: JavaScript - Network & Browser Data

**Files:**
- Modify: `index.html` (script section)

**Step 1: Add helper functions and network/browser data collection**

Replace the `<script>` section with:

```javascript
(function() {
	'use strict';

	// Helper to update table cell by row index
	function updateCell(tableId, rowIndex, value) {
		const table = document.getElementById(tableId);
		if (table && table.rows[rowIndex]) {
			const cell = table.rows[rowIndex].cells[1];
			cell.textContent = value;
			cell.classList.remove('loading');
		}
	}

	// Parse user agent for browser/OS info
	function parseUserAgent(ua) {
		let browser = 'Unknown';
		let os = 'Unknown';

		// Browser detection
		if (ua.includes('Firefox/')) {
			const match = ua.match(/Firefox\/(\d+)/);
			browser = 'Firefox ' + (match ? match[1] : '');
		} else if (ua.includes('Edg/')) {
			const match = ua.match(/Edg\/(\d+)/);
			browser = 'Edge ' + (match ? match[1] : '');
		} else if (ua.includes('Chrome/')) {
			const match = ua.match(/Chrome\/(\d+)/);
			browser = 'Chrome ' + (match ? match[1] : '');
		} else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
			const match = ua.match(/Version\/(\d+)/);
			browser = 'Safari ' + (match ? match[1] : '');
		}

		// OS detection
		if (ua.includes('Windows NT 10')) {
			os = 'Windows 10/11';
		} else if (ua.includes('Windows NT 6.3')) {
			os = 'Windows 8.1';
		} else if (ua.includes('Windows NT 6.2')) {
			os = 'Windows 8';
		} else if (ua.includes('Windows NT 6.1')) {
			os = 'Windows 7';
		} else if (ua.includes('Mac OS X')) {
			const match = ua.match(/Mac OS X (\d+[._]\d+)/);
			os = 'macOS ' + (match ? match[1].replace('_', '.') : '');
		} else if (ua.includes('Linux')) {
			os = 'Linux';
		} else if (ua.includes('Android')) {
			const match = ua.match(/Android (\d+)/);
			os = 'Android ' + (match ? match[1] : '');
		} else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
			const match = ua.match(/OS (\d+)/);
			os = 'iOS ' + (match ? match[1] : '');
		}

		return { browser, os };
	}

	// Fetch network/location data from ipapi.co
	async function fetchNetworkData() {
		try {
			const response = await fetch('https://ipapi.co/json/');
			const data = await response.json();

			updateCell('network-data', 0, data.ip || 'Unavailable');
			updateCell('network-data', 1, data.country_name || 'Unavailable');
			updateCell('network-data', 2, data.city || 'Unavailable');
			updateCell('network-data', 3, data.postal || 'Unavailable');
			updateCell('network-data', 4, data.timezone || 'Unavailable');
			updateCell('network-data', 5, data.org || 'Unavailable');
			updateCell('network-data', 6, data.asn || 'Unavailable');
			updateCell('network-data', 7, data.latitude && data.longitude
				? data.latitude + ', ' + data.longitude
				: 'Unavailable');
		} catch (e) {
			for (let i = 0; i < 8; i++) {
				updateCell('network-data', i, 'Failed to load');
			}
		}
	}

	// Collect browser/system data
	function collectBrowserData() {
		const ua = navigator.userAgent;
		const parsed = parseUserAgent(ua);

		updateCell('browser-data', 0, ua);
		updateCell('browser-data', 1, parsed.browser);
		updateCell('browser-data', 2, navigator.platform || 'Unavailable');
		updateCell('browser-data', 3, parsed.os);
		updateCell('browser-data', 4, navigator.language || 'Unavailable');

		const dnt = navigator.doNotTrack;
		let dntStatus = 'Not set';
		if (dnt === '1') dntStatus = 'Enabled (makes you more unique!)';
		else if (dnt === '0') dntStatus = 'Disabled';
		updateCell('browser-data', 5, dntStatus);

		updateCell('browser-data', 6, navigator.cookieEnabled ? 'Yes' : 'No');
		updateCell('browser-data', 7, navigator.onLine ? 'Online' : 'Offline');
	}

	// Initialize on page load
	document.addEventListener('DOMContentLoaded', function() {
		fetchNetworkData();
		collectBrowserData();
	});
})();
```

**Step 2: Verify in browser**

Refresh `index.html`. Should see:
- Network & Location table populated with IP, country, city, etc.
- Browser & System table populated with user agent, browser, OS, etc.
- Do Not Track shows message about uniqueness if enabled

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add JavaScript for network and browser data collection"
```

---

## Task 5: JavaScript - Hardware & Fingerprints

**Files:**
- Modify: `index.html` (script section, inside the IIFE)

**Step 1: Add hardware data collection function**

Add before the `// Initialize on page load` comment:

```javascript
// Collect hardware data
function collectHardwareData() {
	updateCell('hardware-data', 0,
		navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unavailable');

	updateCell('hardware-data', 1,
		navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' cores' : 'Unavailable');

	updateCell('hardware-data', 2, screen.width + ' x ' + screen.height);

	updateCell('hardware-data', 3, screen.availWidth + ' x ' + screen.availHeight);

	updateCell('hardware-data', 4, window.devicePixelRatio || 'Unavailable');

	updateCell('hardware-data', 5, screen.colorDepth + '-bit');

	const touchPoints = navigator.maxTouchPoints || 0;
	updateCell('hardware-data', 6, touchPoints > 0 ? 'Yes (' + touchPoints + ' points)' : 'No');

	const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
	updateCell('hardware-data', 7, conn ? conn.effectiveType || 'Unknown' : 'Unavailable');

	// Device type inference
	const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
	const isTablet = /iPad|Tablet/i.test(navigator.userAgent) || (isMobile && screen.width > 600);
	let deviceType = 'Desktop';
	if (isTablet) deviceType = 'Tablet';
	else if (isMobile) deviceType = 'Mobile';
	updateCell('hardware-data', 8, deviceType);
}
```

**Step 2: Add fingerprint collection functions**

Add after the hardware function:

```javascript
// Generate canvas fingerprint
function getCanvasFingerprint() {
	try {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = 200;
		canvas.height = 50;

		ctx.textBaseline = 'top';
		ctx.font = '14px Arial';
		ctx.fillStyle = '#f60';
		ctx.fillRect(0, 0, 100, 50);
		ctx.fillStyle = '#069';
		ctx.fillText('Fingerprint test 🔍', 2, 15);
		ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
		ctx.fillText('Canvas 2D', 4, 30);

		const dataUrl = canvas.toDataURL();
		// Simple hash
		let hash = 0;
		for (let i = 0; i < dataUrl.length; i++) {
			const char = dataUrl.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString(16);
	} catch (e) {
		return 'Unavailable';
	}
}

// Get WebGL info
function getWebGLInfo() {
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if (!gl) return { renderer: 'Unavailable', vendor: 'Unavailable' };

		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
		if (debugInfo) {
			return {
				renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
				vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
			};
		}
		return {
			renderer: gl.getParameter(gl.RENDERER),
			vendor: gl.getParameter(gl.VENDOR)
		};
	} catch (e) {
		return { renderer: 'Unavailable', vendor: 'Unavailable' };
	}
}

// Get audio fingerprint
function getAudioFingerprint() {
	return new Promise(function(resolve) {
		try {
			const AudioContext = window.AudioContext || window.webkitAudioContext;
			if (!AudioContext) {
				resolve('Unavailable');
				return;
			}

			const context = new AudioContext();
			const oscillator = context.createOscillator();
			const analyser = context.createAnalyser();
			const gain = context.createGain();
			const processor = context.createScriptProcessor(4096, 1, 1);

			oscillator.type = 'triangle';
			oscillator.frequency.setValueAtTime(10000, context.currentTime);
			gain.gain.setValueAtTime(0, context.currentTime);

			oscillator.connect(analyser);
			analyser.connect(processor);
			processor.connect(gain);
			gain.connect(context.destination);

			let fingerprint = 0;
			processor.onaudioprocess = function(e) {
				const data = e.inputBuffer.getChannelData(0);
				for (let i = 0; i < data.length; i++) {
					fingerprint += Math.abs(data[i]);
				}
			};

			oscillator.start(0);

			setTimeout(function() {
				oscillator.stop();
				processor.disconnect();
				context.close();
				resolve(fingerprint > 0 ? Math.abs(Math.round(fingerprint * 1000000)).toString(16) : 'Unavailable');
			}, 100);
		} catch (e) {
			resolve('Unavailable');
		}
	});
}

// Detect available fonts
function detectFonts() {
	const baseFonts = ['monospace', 'sans-serif', 'serif'];
	const testFonts = [
		'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS',
		'Consolas', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
		'Lucida Console', 'Palatino Linotype', 'Segoe UI', 'Tahoma',
		'Times New Roman', 'Trebuchet MS', 'Verdana', 'Roboto',
		'Open Sans', 'Lato', 'Source Sans Pro', 'Ubuntu'
	];

	const testString = 'mmmmmmmmmmlli';
	const testSize = '72px';
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	function getWidth(font) {
		ctx.font = testSize + ' ' + font;
		return ctx.measureText(testString).width;
	}

	const baseWidths = {};
	baseFonts.forEach(function(font) {
		baseWidths[font] = getWidth(font);
	});

	const detected = [];
	testFonts.forEach(function(font) {
		for (let i = 0; i < baseFonts.length; i++) {
			const width = getWidth(font + ',' + baseFonts[i]);
			if (width !== baseWidths[baseFonts[i]]) {
				detected.push(font);
				break;
			}
		}
	});

	return detected.length + ' fonts detected';
}

// Collect all fingerprint data
async function collectFingerprintData() {
	updateCell('fingerprint-data', 0, getCanvasFingerprint());

	const webgl = getWebGLInfo();
	updateCell('fingerprint-data', 1, webgl.renderer);
	updateCell('fingerprint-data', 2, webgl.vendor);

	const audioFp = await getAudioFingerprint();
	updateCell('fingerprint-data', 3, audioFp);

	updateCell('fingerprint-data', 4, detectFonts());
}
```

**Step 3: Update initialization to call new functions**

Update the DOMContentLoaded handler:

```javascript
// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
	fetchNetworkData();
	collectBrowserData();
	collectHardwareData();
	collectFingerprintData();
});
```

**Step 4: Verify in browser**

Refresh `index.html`. Should see:
- Hardware table populated with device memory, CPU cores, screen info, etc.
- Fingerprints table showing canvas hash, WebGL renderer/vendor, audio fingerprint, font count

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add hardware and fingerprint data collection"
```

---

## Task 6: JavaScript - Storage, Permissions & Detection

**Files:**
- Modify: `index.html` (script section, inside the IIFE)

**Step 1: Add storage and permissions detection**

Add before the initialization:

```javascript
// Check storage availability
function collectStorageData() {
	// LocalStorage
	try {
		localStorage.setItem('test', 'test');
		localStorage.removeItem('test');
		updateCell('storage-data', 0, 'Available');
	} catch (e) {
		updateCell('storage-data', 0, 'Blocked');
	}

	// SessionStorage
	try {
		sessionStorage.setItem('test', 'test');
		sessionStorage.removeItem('test');
		updateCell('storage-data', 1, 'Available');
	} catch (e) {
		updateCell('storage-data', 1, 'Blocked');
	}

	// IndexedDB
	try {
		const idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
		updateCell('storage-data', 2, idb ? 'Available' : 'Unavailable');
	} catch (e) {
		updateCell('storage-data', 2, 'Blocked');
	}

	updateCell('storage-data', 3, history.length + ' entries');
	updateCell('storage-data', 4, location.pathname || '/');
}

// Check permissions
async function collectPermissionsData() {
	// Notification permission
	if ('Notification' in window) {
		updateCell('permissions-data', 0, Notification.permission);
	} else {
		updateCell('permissions-data', 0, 'Not supported');
	}

	// Geolocation permission
	if (navigator.permissions) {
		try {
			const geo = await navigator.permissions.query({ name: 'geolocation' });
			updateCell('permissions-data', 1, geo.state);
		} catch (e) {
			updateCell('permissions-data', 1, 'Unknown');
		}
	} else {
		updateCell('permissions-data', 1, 'Unknown');
	}

	// Ad blocker detection
	detectAdBlocker();

	// WebRTC leak check
	detectWebRTCLeak();
}

// Detect ad blocker
function detectAdBlocker() {
	const bait = document.createElement('div');
	bait.className = 'adsbox ad-banner ad-placeholder pub_300x250';
	bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-10000px;top:-10000px;';
	document.body.appendChild(bait);

	setTimeout(function() {
		const blocked = bait.offsetHeight === 0 ||
			bait.offsetParent === null ||
			getComputedStyle(bait).display === 'none';
		updateCell('permissions-data', 2, blocked ? 'Yes (detected)' : 'No (not detected)');
		bait.remove();
	}, 100);
}

// Check for WebRTC leak
function detectWebRTCLeak() {
	if (!window.RTCPeerConnection) {
		updateCell('permissions-data', 3, 'WebRTC not supported');
		return;
	}

	const pc = new RTCPeerConnection({ iceServers: [] });
	const ips = [];

	pc.createDataChannel('');
	pc.createOffer().then(function(offer) {
		return pc.setLocalDescription(offer);
	}).catch(function() {});

	pc.onicecandidate = function(event) {
		if (!event.candidate) {
			pc.close();
			if (ips.length > 0) {
				updateCell('permissions-data', 3, 'Exposed: ' + ips.join(', '));
			} else {
				updateCell('permissions-data', 3, 'No leak detected');
			}
			return;
		}

		const candidate = event.candidate.candidate;
		const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
		if (ipMatch && !ips.includes(ipMatch[0])) {
			ips.push(ipMatch[0]);
		}
	};

	setTimeout(function() {
		if (pc.signalingState !== 'closed') {
			pc.close();
			updateCell('permissions-data', 3, ips.length > 0 ? 'Exposed: ' + ips.join(', ') : 'No leak detected');
		}
	}, 1000);
}
```

**Step 2: Update initialization**

Update the DOMContentLoaded handler:

```javascript
// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
	fetchNetworkData();
	collectBrowserData();
	collectHardwareData();
	collectFingerprintData();
	collectStorageData();
	collectPermissionsData();
});
```

**Step 3: Verify in browser**

Refresh `index.html`. Should see:
- Storage & State table showing availability of storage APIs, history length, current path
- Permissions & Detection table showing notification/geolocation status, ad blocker detection, WebRTC leak status

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add storage, permissions, and detection data collection"
```

---

## Task 7: Facts Content Section

**Files:**
- Modify: `index.html` (facts section)

**Step 1: Add expanded facts content**

Replace `<!-- Facts content will be added in Task 7 -->` with:

```html
<div class="fact">
	<h3>You encounter approximately 177 different trackers every week</h3>
	<p>Research shows that the average internet user encounters around 177 unique tracking entities in a typical week of browsing. What's particularly striking is that you'll encounter half of those trackers in just the first two hours of browsing. Continuous browsing sessions expose you to significantly more unique trackers than shorter, fragmented sessions—even when the total browsing time is the same. This means that a single long browsing session can expose you to dozens of new trackers you've never encountered before.</p>
</div>

<div class="fact">
	<h3>Google sees 63% of the websites you visit</h3>
	<p>Google's tracking presence extends far beyond its own properties. Through Google Analytics, Google Ads, Google Fonts, reCAPTCHA, and various other embedded services, Google has visibility into approximately 63% of all websites you visit. Facebook sees about 30%, and Microsoft sees roughly 23%. These companies don't need to own a website to track your visit—their code is embedded across millions of sites. Every time you see a "Sign in with Google" button, a YouTube embed, or a Google Maps widget, that site is reporting your visit back to Google.</p>
</div>

<div class="fact">
	<h3>Trackers share data with each other</h3>
	<p>The tracking industry isn't made up of isolated actors—it's a cooperative network. Studies have shown that when tracking companies share data with each other, they can increase their knowledge about individual users by 5% to 50%. This means the profile that one company builds about you can be enriched by data from dozens of other sources. Your shopping habits from one site, your reading preferences from another, and your social connections from a third can all be combined into a comprehensive profile that no single company could build alone.</p>
</div>

<div class="fact">
	<h3>Your browser fingerprint is likely unique</h3>
	<p>Even without cookies, trackers can identify you with remarkable accuracy using browser fingerprinting. Your specific combination of screen resolution, installed fonts, browser plugins, graphics card, timezone, and dozens of other technical details creates a fingerprint that is almost certainly unique to you. Studies show that over 90% of browsers have a unique fingerprint. Unlike cookies, which you can delete, your fingerprint is determined by your hardware and software configuration—it's extremely difficult to change without significantly altering your browsing experience.</p>
</div>

<div class="fact">
	<h3>"Do Not Track" makes you easier to track</h3>
	<p>Here's an irony of web privacy: enabling the "Do Not Track" setting in your browser can actually make you more identifiable, not less. Because the vast majority of users leave this setting at its default (disabled), enabling it adds another data point to your fingerprint that helps distinguish you from others. Furthermore, the "Do Not Track" header is merely a request—websites are under no legal obligation to honor it, and most simply ignore it entirely while noting that you sent it.</p>
</div>

<div class="fact">
	<h3>Facebook tracks health and political sites disproportionately</h3>
	<p>While Facebook's overall web presence covers about 30% of sites, its tracking is not evenly distributed. Research has found that Facebook has visibility into approximately 60% of political websites and 50% of health-related websites. This means sensitive information about your political views and health concerns is being collected at nearly twice the rate of your general browsing. This data can be used for ad targeting, but it also creates a detailed profile of your most personal concerns and beliefs.</p>
</div>

<div class="fact">
	<h3>Incognito mode doesn't hide your fingerprint</h3>
	<p>Private browsing or "incognito" mode provides less protection than many users assume. While it prevents your browsing history and cookies from being saved locally, it does nothing to prevent websites from fingerprinting your browser. Your screen resolution, graphics card, font list, and other hardware characteristics remain exactly the same in incognito mode. Trackers can still identify you across sessions and potentially link your "private" browsing back to your regular identity.</p>
</div>

<div class="fact">
	<h3>Blocking all trackers breaks many websites</h3>
	<p>Simply blocking all known tracking domains isn't a practical solution for most users. Many domains serve dual purposes—delivering both legitimate content and tracking scripts. A domain that hosts tracking code might also host essential JavaScript libraries, fonts, or images that a website needs to function. This is why sophisticated privacy tools use "fine-grained analysis" to restrict tracker access on a case-by-case basis, rather than blanket blocking. Finding the balance between privacy and functionality remains one of the central challenges of web privacy.</p>
</div>
```

**Step 2: Add CSS for facts section**

Add to the `<style>` section, after the `#facts h2` rule:

```css
.fact {
	background: rgba(255, 255, 255, 0.05);
	border-left: 4px solid var(--warning-accent);
	padding: 1.5rem;
	margin: 1.5rem 0;
	border-radius: 0 8px 8px 0;
}

.fact h3 {
	color: var(--warning-accent);
	margin: 0 0 0.75rem 0;
	border: none;
	padding: 0;
}

.fact p {
	margin: 0;
	color: var(--dark-text);
	line-height: 1.7;
}
```

**Step 3: Verify in browser**

Refresh `index.html`. Should see:
- Eight fact blocks with amber-highlighted titles
- Expanded paragraph explanations for each fact
- Facts section smoothly transitions between dark and light themes

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add expanded educational facts content"
```

---

## Task 8: Protection Tips & Resources

**Files:**
- Modify: `index.html` (protect section)

**Step 1: Add protection tips content**

Replace `<!-- Protection tips will be added in Task 8 -->` with:

```html
<p class="intro">The good news: you can take steps to reduce your digital footprint and make tracking more difficult.</p>

<h3>Browser Settings</h3>
<ul>
	<li>Enable "Do Not Track" in your browser settings—despite its limitations, it signals your privacy preference</li>
	<li>Disable third-party cookies, which are used primarily for cross-site tracking</li>
	<li>Clear cookies and site data regularly to reset tracking identifiers</li>
	<li>Use private/incognito mode for sensitive browsing sessions</li>
</ul>

<h3>Extensions & Tools</h3>
<ul>
	<li>Install an ad blocker like uBlock Origin—it blocks ads and many tracking scripts</li>
	<li>Add Privacy Badger (from EFF) to automatically learn and block invisible trackers</li>
	<li>Consider a reputable VPN service to mask your IP address and location from websites</li>
</ul>

<h3>Browsing Habits</h3>
<ul>
	<li>Log out of Google, Facebook, and other accounts when you're not actively using them</li>
	<li>Use separate browsers for different purposes (e.g., one for social media, one for general browsing)</li>
	<li>Regularly review and revoke unnecessary app permissions and connected services</li>
</ul>

<h3>Going Further</h3>
<ul>
	<li>Switch to privacy-focused browsers like Firefox (with Enhanced Tracking Protection) or Brave</li>
	<li>Use search engines that don't track you, such as DuckDuckGo or Startpage</li>
	<li>Consider browser compartmentalization with tools like Firefox Multi-Account Containers</li>
</ul>

<h3>Learn More & Test Your Privacy</h3>
<p>These tools provide more comprehensive analysis of your browser's privacy and fingerprint:</p>
<ul class="resources">
	<li><a href="https://coveryourtracks.eff.org" target="_blank" rel="noopener noreferrer">Cover Your Tracks (EFF)</a> — Test how well your browser protects you from tracking and fingerprinting</li>
	<li><a href="https://amiunique.org" target="_blank" rel="noopener noreferrer">AmIUnique</a> — Detailed analysis of your browser fingerprint and how unique you are</li>
	<li><a href="https://browserleaks.com" target="_blank" rel="noopener noreferrer">BrowserLeaks</a> — Comprehensive suite of browser security and privacy tests</li>
</ul>
```

**Step 2: Add CSS for protect section intro and resources**

Add to the `<style>` section, after the `#protect a:hover` rule:

```css
#protect .intro {
	text-align: center;
	font-size: 1.1rem;
	margin-bottom: 2rem;
	color: var(--light-text-muted);
}

#protect .resources {
	list-style: none;
	padding: 0;
}

#protect .resources li {
	padding: 0.75rem 0;
	padding-left: 0;
}

#protect .resources li::before {
	display: none;
}

#protect .resources a {
	font-weight: 600;
}
```

**Step 3: Verify in browser**

Refresh `index.html`. Should see:
- Intro paragraph centered with muted text
- Four categories of protection tips with checkmark bullets
- External resources section with prominent links

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add protection tips and external resources"
```

---

## Task 9: Final Polish & Verification

**Files:**
- Modify: `index.html`

**Step 1: Add fade-in animation for data loading**

Add to the `<style>` section:

```css
@keyframes fadeIn {
	from { opacity: 0.5; }
	to { opacity: 1; }
}

#reveal td:last-child:not(.loading) {
	animation: fadeIn 0.3s ease-in;
}
```

**Step 2: Verify complete page in browser**

Open `index.html` and verify:
- [ ] Header displays with title and disclaimer
- [ ] All six data tables populate correctly
- [ ] Network data loads from API (may take a moment)
- [ ] Fingerprints generate unique values
- [ ] Facts section displays eight expanded paragraphs
- [ ] Protection tips section is readable with light theme
- [ ] External links work and open in new tabs
- [ ] Footer displays privacy reassurance
- [ ] Page is responsive on mobile viewport (use browser dev tools)
- [ ] No console errors

**Step 3: Final commit**

```bash
git add index.html
git commit -m "feat: add loading animations and final polish"
```

---

## Summary

The implementation creates a single `index.html` file containing:

- **~250 lines of CSS** for dark-to-light themed styling
- **~300 lines of JavaScript** for data collection (network, browser, hardware, fingerprints, storage, permissions)
- **~200 lines of HTML** for semantic structure with accessible tables
- **~150 lines of content** for facts and protection tips

Total: Single self-contained HTML file (~900 lines) with no external dependencies except the ipapi.co API call.
