# Who Wanna Play?

A live poll for the moment when a group of friends can't decide what to do. Someone makes an activity, everyone adds their ideas, and each person votes Yes, No, or No preference on each one. Results show totals only, so nobody knows who voted for Outback.

## How it works

- Make an activity on the home page. Leave it off the home page if you want it private to people with the link.
- Share the link. Anyone with it can add choices and vote.
- Votes save as soon as you tap and can change any time.
- Optional settings: allow only one Yes per person, and hide results until a set time with a countdown.

## Run it

You need Node.js 22 or newer. There are no packages to install.

```bash
cd projects/who-wanna-play
npm start
```

The app runs at `http://localhost:8125`. It only listens on this computer.

If [Tailscale](https://tailscale.com/) is installed, `npm start` also runs `tailscale funnel 8125`. That gives you a public HTTPS link to share with friends. Without Tailscale, only this computer can open the app.

## Self-hosting

Anyone can run their own copy with the steps above. You don't have to trust anyone else's server.

Data lives in `data/` (or the folder in the `WWP_DATA_DIR` environment variable):

- `secret.key` is made on first run. Keep it private, and back it up. Without it, the data can't be read.
- `data.enc` holds every activity, encrypted.

If the key is missing or wrong, the server stops instead of starting empty, so it never overwrites your data.

## Privacy

- The server never saves names. Each name becomes a scrambled code (an HMAC, a keyed one-way hash), and only the code is stored.
- The app only ever shows totals. No page or API shows who picked what.
- Data is encrypted on disk with AES-256-GCM. Tailscale Funnel encrypts it in transit with HTTPS.
- The server only sends its own page files. It never sends the key or data files.
- Your name is kept in a cookie in your browser.

Limits: whoever runs the server holds the key. They could guess a name and check its code, or change the code to log names. If that worries you, run your own copy. With very few voters, the totals can give a vote away.

## Tests

```bash
npm test
```
