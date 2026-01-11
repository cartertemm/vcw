# Tracker Awareness Page Design

## Overview

A single-page web application that demonstrates to users what information trackers, advertisers, and websites can collect about them. The page serves dual purposes: **educational shock value** (showing users how much data is exposed) and **privacy advocacy** (providing actionable steps to protect themselves).

## Core Principles

- **Single HTML file**: Everything self-contained (HTML, CSS, JavaScript inline). No build step, easy to share, can run locally.
- **Privacy-first**: The page itself collects nothing. Clear disclaimer that all information is displayed locally and never logged.
- **Accessible**: Proper semantic HTML, heading hierarchy, tables with headers for screen readers.
- **Visual narrative**: Dark theme for "exposure" section transitions to light theme for "protection" section.

## Page Structure

### 1. Header

- **Title**: "What They Know About You" (or similar impactful headline)
- **Disclaimer**: Brief statement (1-2 sentences) clarifying that this information is displayed locally in the browser, nothing is logged or transmitted to any server.

### 2. The Reveal (Dark Theme)

Data displayed in categorized tables under h3 headings. Dark background (#0a0a0a or #1a1a1a), light text (#e0e0e0), monospace font for data values. Subtle fade-in animations as data loads.

#### Network & Location
| Data Point | Description |
|------------|-------------|
| IP Address | Public IP address |
| Country | Geographic country |
| City | Geographic city |
| Postal Code | Postal/ZIP code |
| Timezone | System timezone |
| ISP | Internet Service Provider |
| ASN | Autonomous System Number |
| Latitude/Longitude | Approximate coordinates |

*Source: Single fetch to `https://ipapi.co/json/`*

#### Browser & System
| Data Point | Source |
|------------|--------|
| User Agent | `navigator.userAgent` |
| Browser Name/Version | Parsed from user agent |
| Platform | `navigator.platform` |
| OS Name/Version | Parsed from user agent |
| Language | `navigator.language` |
| Do Not Track | `navigator.doNotTrack` |
| Cookies Enabled | `navigator.cookieEnabled` |
| Online Status | `navigator.onLine` |

#### Hardware
| Data Point | Source |
|------------|--------|
| Device Memory | `navigator.deviceMemory` (RAM in GB) |
| CPU Cores | `navigator.hardwareConcurrency` |
| Screen Width | `screen.width` |
| Screen Height | `screen.height` |
| Pixel Ratio | `window.devicePixelRatio` |
| Color Depth | `screen.colorDepth` |
| Touch Support | `navigator.maxTouchPoints` |
| Connection Type | `navigator.connection?.effectiveType` |
| Device Type | Inferred from user agent/screen |

#### Fingerprints
| Data Point | Method |
|------------|--------|
| Canvas Fingerprint | Draw hidden shapes/text to canvas, extract base64, generate hash |
| WebGL Renderer | Query `WEBGL_debug_renderer_info` extension |
| WebGL Vendor | Query `WEBGL_debug_renderer_info` extension |
| Audio Fingerprint | Create oscillator, capture output characteristics, hash result |

*Brief tooltips or explanatory text for each fingerprint type explaining what it is and why it matters.*

#### Storage & State
| Data Point | Method |
|------------|--------|
| LocalStorage Available | Try-catch test |
| SessionStorage Available | Try-catch test |
| IndexedDB Available | Try-catch test |
| History Length | `history.length` |
| Current Path | `location.pathname` |

#### Permissions & Detection
| Data Point | Method |
|------------|--------|
| Notification Permission | `navigator.permissions.query` |
| Geolocation Permission | `navigator.permissions.query` |
| Ad Blocker Detected | Attempt to load a bait element/script |
| WebRTC Leak | Check for local/public IP exposure via RTCPeerConnection |
| System Fonts | Measure text rendering variations across font list |

### 3. The Facts (Transitional Section)

Visual gradient transition from dark to light. Muted amber/yellow accents for "caution" feel. Each fact presented as an expanded paragraph with context and explanation (not terse bullet points).

**Facts to include (expanded with full context):**

1. **"You encounter approximately 177 different trackers every week"**
   - Explain that half of these are encountered in just the first two hours of browsing
   - Continuous browsing sessions expose users to more unique trackers than fragmented sessions

2. **"Google sees 63% of websites you visit"**
   - Facebook sees approximately 30%, Microsoft sees approximately 23%
   - They don't need to own the website to track your visit there
   - Tracking scripts, analytics, and ad networks are embedded across the web

3. **"Trackers share data with each other"**
   - Companies can increase their knowledge about you by 5-50% through data cooperation agreements
   - Your data from one site can be combined with data from many others to build a comprehensive profile

4. **"Your browser fingerprint is likely unique"**
   - Canvas rendering, WebGL capabilities, fonts, and hardware specifications combine into an identifier
   - This fingerprint is as reliable as cookies for tracking, but you can't simply delete it
   - Even small variations in configuration create unique signatures

5. **"'Do Not Track' makes you easier to track"**
   - Ironic but true: enabling Do Not Track adds to your unique fingerprint
   - Most users leave this setting off, so enabling it makes you stand out
   - The setting is largely ignored by trackers anyway

6. **"Facebook tracks health and political sites disproportionately"**
   - 60% visibility into political websites, 50% into health websites
   - This is despite only having 30% overall web coverage
   - Sensitive categories are tracked more heavily than general browsing

7. **"Incognito mode doesn't hide your fingerprint"**
   - Private browsing blocks cookies and browsing history
   - Your hardware and browser fingerprint remains identical
   - Trackers can still identify you across private browsing sessions

8. **"Blocking all trackers breaks many websites"**
   - Many domains serve both legitimate content and tracking
   - Sophisticated filtering is required to block tracking while maintaining functionality
   - Simple domain blocking often causes websites to malfunction

### 4. Protect Yourself (Light Theme)

Background shifts to off-white (#f8f8f8), dark text (#333), calming blue or green accents for "safety" feel. Brief intro: "The good news: you can take steps to reduce your exposure."

#### Browser Settings
- Disable third-party cookies in your browser settings
- Clear cookies and site data regularly
- Use private/incognito mode for sensitive browsing

#### Extensions & Tools
- Use an ad blocker (uBlock Origin is highly recommended)
- Install Privacy Badger for automatic tracker blocking
- Consider a VPN to mask your IP address and location

#### Browsing Habits
- Log out of Google/Facebook when not actively using them
- Use separate browsers for social media vs. general browsing
- Review and limit app permissions regularly

#### Going Further
- Try privacy-focused browsers (Firefox, Brave)
- Use search engines that don't track (DuckDuckGo, Startpage)
- Check your exposure with comprehensive tools (see resources below)

#### External Resources
- **Cover Your Tracks (EFF)**: https://coveryourtracks.eff.org - Test your browser's fingerprint and tracking protection
- **AmIUnique**: https://amiunique.org - Detailed browser fingerprint analysis
- **BrowserLeaks**: https://browserleaks.com - Comprehensive browser security testing

### 5. Footer

- Reiterates the privacy message: "This page runs entirely in your browser. No data was collected, logged, or transmitted."
- Optional: Link to source code or project information

## Technical Implementation

### Dependencies
- None (fully self-contained)
- Single external API call: `https://ipapi.co/json/` for IP geolocation

### Browser APIs Used
- `navigator` object (userAgent, platform, language, deviceMemory, hardwareConcurrency, etc.)
- `screen` object (width, height, colorDepth)
- `window` object (devicePixelRatio, history, location)
- Canvas API (for fingerprinting)
- WebGL API (for renderer/vendor info)
- AudioContext API (for audio fingerprinting)
- RTCPeerConnection (for WebRTC leak detection)
- Permissions API (for notification/geolocation status)

### Styling
- Embedded CSS in `<style>` tag
- System font stack (no external font loading)
- CSS Grid/Flexbox for responsive layout
- CSS custom properties for theme colors
- Sufficient color contrast for accessibility

### JavaScript
- Embedded in `<script>` tag
- Vanilla JavaScript (no frameworks)
- Async/await for API calls
- Graceful degradation for unsupported APIs

### Accessibility
- Proper heading hierarchy (h1 > h2 > h3)
- Tables with `<th>` headers and appropriate scope
- ARIA labels where helpful
- Sufficient color contrast in both themes
- Focus indicators for interactive elements

## File Structure

```
index.html (single file containing everything)
```

## Open Questions / Future Considerations

- Consider adding a "Download Report" button to save findings as PDF/text
- Could add comparison feature showing how unique user's fingerprint is
- Potential for localization/translation support
