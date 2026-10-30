# Score Tracker

Keep score for in-person games with any number of teams. Each team has a name, a color, and a score. Press plus or minus to change a score. Scores never go below 0.

Teams and scores are saved to `teams.csv` in this folder, so they survive a restart. You can open or edit the file in any spreadsheet app. It has three columns: `name`, `color`, and `score`.

## Run it

You need Python 3. Nothing else needs to be installed.

```sh
python server.py
```

Then open http://localhost:8000 in your browser. Press Ctrl+C in the terminal to stop the server.

## Use it

1. Select **Manage teams**. This button is always at the top of the page.
2. Select **Add team**, type a name, and pick a color. If you leave the color on **Random**, the app picks one for you.
3. Select **Done** to go to the scoreboard.
4. Press **+** or **−** next to a team to change its score.
