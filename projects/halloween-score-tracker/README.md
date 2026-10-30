# Halloween Score Tracker

We were playing some in-person games for Halloween. Who wants to pick up a pen and paper when you can just vibecode scoring into existence, with sound effects to boot?

Keep score for in-person games with any number of teams. Each team has a name, a color, and a score. Press plus or minus to change a score. Scores never go below 0.

Teams and scores are saved to `teams.csv` in this folder, so they survive a restart. You can open or edit the file in any spreadsheet app. It has three columns: `name`, `color`, and `score`.

## Run it

You need Python 3. Nothing else needs to be installed.

```sh
python server.py
```

Then open http://localhost:8000 in your browser. Press Ctrl+C in the terminal to stop the server.

The server is also open to other devices on your network, so you can keep score from a phone or show the board on a TV. It prints the address to use, such as `http://192.168.1.20:8000`. The first time you run it, Windows may ask if Python can use the network. Allow it for private networks. Anyone on your network can open the page and change scores.

## Use it

1. Select **Manage teams**. This button is always at the top of the page.
2. Select **Add team**, type a name, and pick a color. If you leave the color on **Random**, the app picks one for you.
3. Select **Done** to go to the scoreboard.
4. Press **+** or **−** next to a team to change its score.

## Sounds

Each press plays a random sound from `sounds/plus` or `sounds/minus`. To add or remove a sound, add or delete a file in that folder and reload the page. The app supports OGG, MP3, WAV, M4A, and FLAC files.

Older iPhones can't play OGG files. If you add an OGG file, also add an MP3 copy with the same name, such as `boo.ogg` and `boo.mp3`. The app plays only one of the two, picking the one the browser supports.
