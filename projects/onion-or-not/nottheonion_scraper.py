"""Fetch ALL post titles from r/nottheonion and write them to a text file.

Reddit's own feeds (new/top/hot, JSON or RSS) are hard-capped at ~1000 most
recent posts, so they can't reach the full history. This instead uses the
Arctic Shift archive (the public successor to Pushshift), paging forward
through time from the subreddit's creation to now.

Titles are appended to the output file page-by-page (and flushed) as they're
fetched, so progress is visible live and an interrupted run keeps whatever it
already pulled instead of losing everything.

Network robustness: Arctic Shift occasionally returns a transient error
(observed: HTTP 422 mid-run, which is NOT reproducible for the same cursor and
clears on a retry). Each page is therefore retried with backoff. If a cursor
still fails after all retries, the run skips that time window and continues
rather than crashing or looping forever.
"""

import json
import socket
import time
import urllib.error
import urllib.parse
import urllib.request

SUBREDDIT = "nottheonion"
OUTPUT_FILE = "nottheonion_titles.txt"
START_DATE = "2008-01-01"   # before the subreddit existed; safe lower bound
PAGE_SIZE = 100			 # Arctic Shift max per request
SLEEP = 0.5				 # seconds between successful requests (be polite)
TIMEOUT = 30				# per-request socket timeout (seconds)
MAX_RETRIES = 5			 # attempts per page before giving up on it
RETRY_BASE_SLEEP = 3		# backoff base; waits 3s, 6s, 9s, ... between tries
SKIP_AHEAD = 3600		   # on persistent failure, jump cursor forward (sec)
API = "https://arctic-shift.photon-reddit.com/api/posts/search"
HEADERS = {"User-Agent": "onion-title-scraper/4.0 (by /u/cartertemm)"}


def fetch_page(after):
	"""Make one request. Raises on HTTP/network error; returns list of posts."""
	params = urllib.parse.urlencode({
		"subreddit": SUBREDDIT,
		"limit": PAGE_SIZE,
		"sort": "asc",
		"after": after,
		"fields": "id,title,created_utc",
	})
	request = urllib.request.Request(f"{API}?{params}", headers=HEADERS)
	with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
		payload = json.load(response)
	if payload.get("error"):
		raise RuntimeError(payload["error"])
	return payload["data"] or []


def fetch_page_with_retry(after):
	"""Fetch a page, retrying transient errors with backoff.

	Returns the list of posts on success (possibly empty = end of archive),
	or None if every attempt failed (caller should skip this window).
	"""
	for attempt in range(1, MAX_RETRIES + 1):
		try:
			return fetch_page(after)
		except (urllib.error.HTTPError, urllib.error.URLError,
				socket.timeout, TimeoutError, RuntimeError) as err:
			if attempt == MAX_RETRIES:
				print(f"  ! after={after}: {err} -- gave up after "
					  f"{MAX_RETRIES} attempts", flush=True)
				return None
			wait = RETRY_BASE_SLEEP * attempt  # 3s, 6s, 9s, ...
			print(f"  ! after={after}: {err} -- retry "
				  f"{attempt}/{MAX_RETRIES} in {wait}s", flush=True)
			time.sleep(wait)


def fetch_all_titles():
	seen_ids = set()
	total = 0
	after = START_DATE

	# Truncate the file once up front, then append each page as we go so the
	# file on disk always reflects everything fetched so far.
	with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
		while True:
			page = fetch_page_with_retry(after)

			# Persistent failure: don't crash, don't spin on the same cursor.
			# Nudge past the bad window and keep going (skips a small slice).
			if page is None:
				if isinstance(after, (int, float)):
					after = int(after) + SKIP_AHEAD
					print(f"  !! skipping ahead to after={after} and "
						  f"continuing", flush=True)
					continue
				# Failed on the very first (date-string) request: nothing to
				# advance from, so stop rather than loop forever.
				print("  !! initial request failed; aborting", flush=True)
				break

			# Empty list = we've reached the end of the archive.
			if not page:
				break

			new_titles = []
			for post in page:
				pid = post.get("id")
				if pid in seen_ids:
					continue
				seen_ids.add(pid)
				title = post.get("title")
				if title:
					# Guard the one-title-per-line format against titles that
					# contain embedded newlines.
					new_titles.append(title.replace("\r", " ").replace("\n", " "))

			if new_titles:
				out.write("\n".join(new_titles) + "\n")
				out.flush()  # push this page to disk immediately
				total += len(new_titles)

			# Advance the cursor to the last post's timestamp. Using the raw
			# timestamp (not +1) plus the seen_ids set avoids skipping or
			# duplicating posts that share the same second.
			after = page[-1]["created_utc"]
			print(f"Fetched {total} titles so far "
				  f"(+{len(new_titles)} this page)...", flush=True)

			# A short page means we've reached the end of the archive.
			if len(page) < PAGE_SIZE:
				break

			time.sleep(SLEEP)

	return total


def main():
	total = fetch_all_titles()
	print(f"\nDone. Wrote {total} unique titles to {OUTPUT_FILE}")


if __name__ == "__main__":
	main()
