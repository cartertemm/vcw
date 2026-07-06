# Catch Phrase Companion

A screen reader first web app that emulates the Hasbro Electronic Catch Phrase handheld, button for button.

## Why

The original handheld shows the word on a small LCD screen. That works fine if you can see it, but it leaves blind and low vision players out of the game entirely. This app puts the same gameplay behind accessible controls: the current word is announced through a live region, so it reaches an earbud or a braille display instead of a screen only sighted players can read.

## How to play

There are five buttons:

- **Category**: cycles through the six word categories. Only works between rounds, it locks once a round starts.
- **Timer**: starts a round, stops a round in progress, or (after a win) resets the score and starts the next game.
- **Next**: skips to a new word, only during a round.
- **Team 1** and **Team 2**: press whichever button matches the team that just guessed correctly. Each press adds a point and announces the new score.

Play follows the classic rules. Pass the device around your group. When it's your team's turn, someone describes the word on screen (or in your ear) without saying any part of it, and teammates guess. When your team gets it, press your team's button, and the phrase advances to a new word for the next team. The timer counts down invisibly with beeps that speed up as time runs low, ending in a buzzer. Whichever team is holding the "phone" when the buzzer sounds gives the point to the other team, which the game reflects automatically once the round ends. First team to seven points wins, complete with a little fanfare.

## Categories

Six categories are available: **Everything** (the union of all the others), **Around the World**, **Fun and Games**, **On the Air**, **Snack Time**, and **The Great Outdoors**, matching the categories in Ultimate Catch Phrase.

## Installing on iOS

Open the site in Safari, tap the Share button, then choose "Add to Home Screen." Launch it from your home screen icon afterward. This gives you a full screen app with no address bar clutter, more reliable VoiceOver gesture handling, and audio that keeps running when the tab isn't the active one. The app will prompt you to do this the first time you visit in a plain browser tab.

## Running locally

This is a plain HTML/JS/CSS app with no build step. To serve it locally:

```
node tools/serve.mjs
```

Then open `http://localhost:8123/` in a browser.

## Running tests

```
npm test
```

## Word list provenance

The five category lists total 3471 phrases. 2795 were written from scratch for this project. The remaining 676 were adapted from [`nick-aschenbach/game-words`](https://github.com/nick-aschenbach/game-words) (MIT licensed), sorted into whichever of the five categories fit best, filtered to exclude anything too simple for an adult audience, and filtered so that named individuals are limited to historical or fictional figures rather than living public figures. `nick-aschenbach/game-words` is copyright Nick Aschenbach and used here under the terms of its MIT license.

## Word privacy

The app doesn't try to hide the word from anyone in the room, that's the players' job. If you're using a screen reader, use an earbud or a braille display so only you can perceive the word, the same way a sighted player would cup their hand around the handheld's screen.
