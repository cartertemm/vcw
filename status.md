# Status

This document tracks both the status of the things that I've built (OK fine my agents built them while I was watching Netflix/working out/whatever), and the ideas I've wanted to bring into reality.

## already Built

- Catch Phrase Companion. A screen reader first web app that emulates the Hasbro Electronic Catch Phrase handheld button for button, extended with an "after dark" NSFW category.
- Data Encoder/Decoder. A minimalist single-file web application for encoding and decoding text in 40+ formats. Sort of like an accessibility first Cyberchef with only the most common input/output formats.
- Falsehoods About Time with Explanations. Explanations for all 112 things that programmers falsely believe about time.
- Focus. Brainwave entrainment and soundscape sculpting. A single-file, zero-dependency web app inspired by papers on the impact of sonic frequencies on mood (creativity, focus and concentration, etc). Sounded better on paper than in reality, but sometimes you gotta try doing something to know that you're in way over your head.
- Hello World. Welcome to Vibe Code Weekly!
- Most Likely To. Electronic version of the "Most Likely To" card game, with both SFW and NSFW packs.
- Onion or Not. Determine whether a headline is real or came from The Onion. Harder than it sounds.
- Rhythmic Captcha. the captchas you know and hate, except the only way to solve it is by repeating the rhythm you hear.
- What They Know About You. A single-page web tool that reveals what information websites, trackers, and advertisers can learn about you through your browser.

## Ideas

- Game center/arcade: We are making a lot of games that run on mobile/desktop/etc. Many of them use the same platform/SPA/installable home screen app scaffold. It only makes sense to build out a generic directory of them so that people do not have to worry about adding new ones or changing their home screen icons.
- Trump or not? Determine whether a quote was said by Donald Trump, or someone else, with full attribution for each quote. 
- Patent or nonsense? Identify whether an absurd sounding patent is real or not. Data gathering would be possible via USPTO full-text search.
- Florida Man or fiction? Same style as the above.
- Price is Wrong. Guess the year that a product cost a certain amount, with outlandish Ebay or collectable sales thrown in for good measure.
- Headers inspector for humans. Paste a curl output or fetch a URL, get a plain-language readout of what every security header does and which ones are missing in the style of data encoder/decoder.
- Regex explainer. Paste a regex, get a plain-English breakdown and step-through of how it matches a test string. While there are visual regex tools, I do not know of one that works well with a screen reader.
- Cron expression translator. Similar to the Regex explainer, but this one would work in both directions. You could do expression to English and English to expression, with a visual cron expression builder thrown in for fun.
- Email header forensics. Paste raw email headers, get the delivery path presented in plain english.
- DNS record explainer. Same general idea.
- Curlbuilder in reverse. Paste a curl command from some API's docs, get plain English: method, headers, auth type, what the payload means, plus a fetch() equivalent.
- WgetBuilder: curlbuilder but not, with support for all of wget's options.
- Command line flag translator. Paste `tar -xzvf` or `rsync -avzP` and get each flag expanded and explained. this way you know what a command will do before you run it. Would need to bundle man pages from all of coreutils and common utilities. Explainshell already exists, but maybe we could expand on it. Bonus points if we're able to build out an API.
- Accessible diff viewer. Most of the diff viewers that I have seen can tell you which lines were changed, but little to nothing past that. I would like to be able to quickly determine that i.e. "line 4, word 3 changed from X to Y."
- Accessible table summarizer. Paste an HTML table or CSV and get a screen-reader-friendly version with stats presented as an intarigation style interface e.g. "column 3, average 42, highest in row 7".
- Keyboard shortcut conflict checker. Pick your screen reader, browser, and OS. Then enter a keystroke, and see which shortcuts collide. The hardest part about this one would be generating a good dataset and keeping it updated.
- Number namer. Paste 4294967296 and learn it's 2^32. Or 86400 and learn it's the number of seconds in a day. A reverse lookup for numbers with their significance, built from a huge curated table.
- Which came first? Presents two inventions, words, or events and you have to pick the older one, e.g. "the fax machine or the telephone?" Sourcing could just come from Wikipedia or an encyclopedia.
- Conspiracy or declassified? Things that different governments actually did (MKUltra, Operation Northwoods drafts, CIA heart attack gun, etc) versus invented conspiracies (possibly from r/conspiracy). Every real answer would need to link to declassified documents for verification. A game that could turn into quite the interesting rabbit hole if built correctly.
- Guess the language. Given a short text-to-speech clip or see a transliterated sentence, you have to guess the language. Difficulty tiers from "Spanish vs French" to "Norwegian vs Danish." Again, the dataset would be the greatest challenge here, but Google Translate + TTS might make it a non-issue, from there an AI could recommend language pairs.
- What year is this tech prediction from? "By [year], nobody will own a car." How many times have you heard that one? Given famous predictions with the date stripped, you have to guess the decade.
- Collaborative story chain (pass-the-phone party game). A communal device and a pair of headphones is passed around the room. Each player sees/hears only the previous sentence and adds one. Once the story is complete, the app reads the glorious wreckage aloud at the end. Kinda like telephone on steroids.
- Consensus. Everyone secretly answers a numeric question on their own phone ("what percent of people have admitted to crying at work?", "What percent of American marriages end in divorce?", etc). The app reveals the spread and the real statistic.
- Generic guessing engine with category packs. Most of these short guessing games use a version of the same skeleton (x or y), so we should really stop re-inventing it.
- Twenty questions. Given a word (a thing or an event probably), the crowd has to guess it. How long does it take?
