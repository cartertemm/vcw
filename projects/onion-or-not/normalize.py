#!/usr/bin/env python3
"""
Normalize a headline corpus (one headline per line) for the Onion-vs-not
classification dataset.

Run the SAME pipeline on every corpus (the Onion titles and the not-Onion
titles) so that normalization never becomes a source tell the model can cheat
on -- the whole point is to keep the signal in the humor, not in quote styles
or scraper artifacts.

Pipeline, per line:
  1. Unicode NFC normalize; decode any leftover HTML entities; strip stray tags.
  2. Fold source-specific glyphs to a canonical form:
        smart quotes ' ' " "  -> straight ' "
        em / en dashes  - -    -> hyphen -
        ellipsis  ...          -> ...
        non-breaking / zero-width spaces -> normal space (or removed)
  3. Optionally unwrap a headline that is entirely enclosed in quotes.
  4. Collapse internal whitespace and trim.

Then filtering / dedup:
  5. Drop headlines that mention the brand "the onion" (word-boundary,
     case-insensitive) OR any brand/section term in BRAND_KEYWORDS (e.g.
     "Onion News Network", "Onion Sports", "TheOnion.com"). These are
     self-referential giveaways. Plain vegetable uses ("Man Cries Cutting
     Onion") are kept. Disable the whole brand filter with --keep-onion.
  6. Drop headlines with fewer than MIN_WORDS words (default 4).
  7. Drop headlines with no alphabetic word (pure dates/numbers/symbols).
  8. De-duplicate case-insensitively on a normalized key (casefold + punctuation
     stripped + whitespace collapsed), keeping the first occurrence's display
     form. Use --lower to also lowercase the output text itself.

First-seen order is preserved (deterministic). Per-stage drop counts are printed
to stderr.

Usage:
    python normalize.py INPUT [OUTPUT]
    python normalize.py onion_titles.txt onion_titles.normalized.txt
    python normalize.py nottheonion_titles.txt nottheonion_titles.normalized.txt
"""

import argparse
import html
import re
import sys
import unicodedata

MIN_WORDS = 4

# Brand / section terms that leak "this is The Onion". Matched case-insensitively
# as substrings against the whitespace-normalized headline. Keep these lowercase.
# ("Onion gamers" is the intended form of the reported "Oion gamers" typo.)
BRAND_KEYWORDS = [
    "onion news network",
    "onion news",
    "onion book of known knowledge",
    "onion weekender",
    "onion lotto",
    "onion sports",
    "onion social",
    "onion article",
    "onion politics",
    "theonion.com",
    "onion store",
    "onion bucks",
    "onion explains",
    "onion fact checks",
    "onion gift guide",
    "onion public radio",
    "onion radio",
    "onion talks",
    "onion year",
    "onion gamers",
    "our annual year",
    "onion reporter",
    "onion reporters",
    "onion special",
    "onions tips",
    "onion website",
]

# Glyph folding: map source-specific characters to a canonical form.
_TRANSLATE = {
    0x2018: "'", 0x2019: "'", 0x201A: "'", 0x201B: "'",   # single quotes
    0x2032: "'",                                            # prime
    0x201C: '"', 0x201D: '"', 0x201E: '"', 0x201F: '"',   # double quotes
    0x2033: '"',                                            # double prime
    0x2013: "-", 0x2014: "-", 0x2015: "-",                 # en/em/horizontal bar
    0x00A0: " ", 0x2007: " ", 0x202F: " ",                 # non-breaking spaces
    0x200B: "", 0x200C: "", 0x200D: "", 0xFEFF: "",        # zero-width / BOM
}

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_ELLIPSIS_RE = re.compile(r"…")
_THE_ONION_RE = re.compile(r"\bthe\s+onion\b", re.IGNORECASE)   # brand, not vegetable
_PUNCT_RE = re.compile(r"[^\w\s]", re.UNICODE)
_ALPHA_WORD_RE = re.compile(r"[^\W\d_]", re.UNICODE)            # any alphabetic char


def normalize_text(line):
    """Apply glyph/whitespace normalization; return the cleaned display text."""
    t = unicodedata.normalize("NFC", line)
    t = html.unescape(t)
    t = _TAG_RE.sub("", t)
    t = _ELLIPSIS_RE.sub("...", t)
    t = t.translate(_TRANSLATE)
    t = _WS_RE.sub(" ", t).strip()
    t = _unwrap_quotes(t)
    return t


def _unwrap_quotes(t):
    """Strip surrounding quotes only when the whole headline is enclosed."""
    if len(t) >= 2 and t[0] == '"' and t[-1] == '"' and t.count('"') == 2:
        return t[1:-1].strip()
    if len(t) >= 2 and t[0] == "'" and t[-1] == "'" and t.count("'") == 2:
        return t[1:-1].strip()
    return t


def is_brand(text):
    """True if the headline contains the Onion brand or any blocked section term."""
    if _THE_ONION_RE.search(text):
        return True
    low = text.casefold()
    return any(kw in low for kw in BRAND_KEYWORDS)


def dedup_key(t):
    """Case-insensitive key: casefold, drop punctuation, collapse whitespace."""
    k = _PUNCT_RE.sub(" ", t.casefold())
    return _WS_RE.sub(" ", k).strip()


def main():
    ap = argparse.ArgumentParser(description="Normalize a headline corpus.")
    ap.add_argument("input")
    ap.add_argument("output", nargs="?")
    ap.add_argument("--min-words", type=int, default=MIN_WORDS,
                    help="drop headlines with fewer than this many words")
    ap.add_argument("--keep-onion", action="store_true",
                    help="do NOT drop headlines mentioning the Onion brand/sections")
    ap.add_argument("--lower", action="store_true",
                    help="lowercase the output text (not just the dedup key)")
    args = ap.parse_args()

    out_path = args.output or re.sub(r"(\.txt)?$", ".normalized.txt", args.input, count=1)

    stats = {"read": 0, "blank": 0, "brand": 0, "short": 0, "non_alpha": 0,
             "dup": 0, "kept": 0}
    seen = set()
    kept = []

    with open(args.input, encoding="utf-8") as f:
        for raw in f:
            stats["read"] += 1
            text = normalize_text(raw)
            if not text:
                stats["blank"] += 1
                continue
            if not args.keep_onion and is_brand(text):
                stats["brand"] += 1
                continue
            if len(text.split()) < args.min_words:
                stats["short"] += 1
                continue
            if not _ALPHA_WORD_RE.search(text):
                stats["non_alpha"] += 1
                continue
            key = dedup_key(text)
            if key in seen:
                stats["dup"] += 1
                continue
            seen.add(key)
            kept.append(text.lower() if args.lower else text)

    stats["kept"] = len(kept)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(kept) + ("\n" if kept else ""))

    sys.stderr.write(
        "normalize: {read} read -> {kept} kept "
        "(dropped: blank={blank}, brand={brand}, <{mw}words={short}, "
        "non-alpha={non_alpha}, dup={dup})\n"
        "wrote {out}\n".format(mw=args.min_words, out=out_path, **stats))


if __name__ == "__main__":
    main()
