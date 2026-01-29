# Data Encoder/Decoder

A minimalist single-file web application for encoding and decoding text in 40+ formats.

## Usage

Open `index.html` in any modern browser. No build step or dependencies required.

1. Enter or paste text
2. Select a format from the dropdown
3. Click **Encode** or **Decode**
4. Result replaces the input (chain operations by encoding/decoding multiple times)

## Supported Formats

### Binary/Numeric
- Base64, Base32, Hexadecimal, Binary, Octal, Decimal (ASCII)

### Web
- URL Encoding, HTML Entities (Named & Numeric), Punycode

### Unicode/Escape
- Unicode Escape (`\u`), JavaScript Escape (`\x`), CSS Escape, UTF-8 Bytes, UTF-16 Code Units

### Ciphers
- ROT13, ROT47, Caesar Cipher (configurable shift), Atbash, Vigenere Cipher (with key), Pig Latin

### Transforms
- Reverse Text, Reverse Words, Upside Down, Leetspeak, NATO Phonetic, Alternating Case

### Hashes (Encode Only)
- MD5, SHA-1, SHA-256, SHA-512

### Data
- JSON Pretty/Minify, XML Escape, Regex Escape, JWT Decode

### Legacy/Other
- Quoted-Printable, UUencode, Morse Code, Roman Numerals, Braille

## Special Options

- **Caesar Cipher**: Slider to set shift amount (1-25)
- **Vigenere Cipher**: Text input for encryption key
- **Hashes**: Encode button only (one-way functions)
- **JWT Decode**: Decode button only

## Browser Support

Requires a modern browser with ES6+ and Web Crypto API support.
