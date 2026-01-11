# What They Know About You

A single-page web tool that reveals what information websites, trackers, and advertisers can learn about you through your browser.

## Purpose

This educational tool demonstrates the extensive data that can be collected about you simply by visiting a website. All information is displayed locally in your browser—nothing is logged, stored, or transmitted to any server.

## Features

### Data Collection Demo

The page displays information across six categories:

- **Network & Location** - IP address, country, city, postal code, timezone, ISP
- **Browser & System** - User agent, browser version, platform, OS, language, Do Not Track status
- **Hardware** - Device memory, CPU cores, screen resolution, pixel ratio, touch support, connection type
- **Fingerprints** - Canvas fingerprint, WebGL renderer/vendor, audio fingerprint, detected fonts
- **Storage & State** - LocalStorage, SessionStorage, IndexedDB availability, history length
- **Permissions & Detection** - Notification/geolocation permissions, ad blocker detection, WebRTC leak check

### Educational Content

- Eight facts about online tracking practices with detailed explanations
- Statistics on tracker prevalence and data sharing
- Information about browser fingerprinting and its implications

### Protection Tips

Actionable recommendations organized by category:
- Browser settings to adjust
- Privacy extensions to install
- Browsing habits to adopt
- Links to comprehensive privacy testing tools

## Usage

Simply open `index.html` in any modern web browser. No server, build step, or installation required.

```
# Clone and open
git clone <repository>
cd WhatIKnowAboutYou
open index.html  # or double-click the file
```

## Technical Details

- **Single file** - Everything is self-contained in one HTML file (~900 lines)
- **No dependencies** - Pure HTML, CSS, and vanilla JavaScript
- **One external API** - Uses ip-api.com for IP geolocation (the only network request)
- **Responsive design** - Works on desktop and mobile devices
- **Accessible** - Semantic HTML with proper heading hierarchy and table structure

## Privacy

This tool practices what it preaches:
- No analytics or tracking scripts
- No data transmission (except the single IP lookup)
- No cookies or local storage used by the page itself
- Can be saved and run completely offline (IP lookup will fail gracefully)

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Some features may show "Unavailable" in browsers with strict privacy protections enabled—which is actually a good sign!

## External Resources

The page links to these comprehensive privacy testing tools:
- [Cover Your Tracks (EFF)](https://coveryourtracks.eff.org)
- [AmIUnique](https://amiunique.org)
- [BrowserLeaks](https://browserleaks.com)

## License

MIT
