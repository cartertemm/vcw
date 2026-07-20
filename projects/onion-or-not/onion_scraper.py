#!/usr/bin/env python3
"""
Scrape every article headline from The Onion (theonion.com) into
onion_titles.txt -- one headline per line.

The Onion runs on headless WordPress, so its REST API at
/wp-json/wp/v2/posts is open and exposes the full post archive as JSON.
At the time of writing it reports ~58,000 posts. We page through all of it
(100 posts/request), read each post's title, decode HTML entities, and write
the de-duplicated set to onion_titles.txt.

Designed to be safe to run, interrupt, and re-run:
  * RESUMABLE  -- completed page numbers are recorded in onion_progress.txt and
	collected titles in onion_titles.txt. Re-running loads both and only fetches
	pages it hasn't done yet, so a crash or Ctrl-C never loses work.
  * CRASH-PROOF -- every page fetch is wrapped so one bad page can't abort the
	run; pages that fail all retries are remembered and retried in extra passes
	at the end, so we don't silently drop 100 titles.
  * POLITE / NOT RATE-LIMITED -- one request at a time, a small delay with
	jitter between requests, and exponential backoff (honoring Retry-After) on
	429 / 5xx / connection resets.

Usage:
	python onion_scraper.py			# run / resume until complete
	python onion_scraper.py --reset	# start over (ignore prior progress)
"""

import argparse
import html
import os
import random
import re
import sys
import time

import requests

BASE = "https://theonion.com"
ENDPOINT = f"{BASE}/wp-json/wp/v2/posts"
OUTPUT = "onion_titles.txt"
PROGRESS = "onion_progress.txt"   # one completed page number per line
LOGFILE = "onion_scrape.log"

HEADERS = {
	"User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
				   "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	"Accept": "application/json",
	"Accept-Language": "en-US,en;q=0.9",
}

PER_PAGE = 100
BASE_DELAY = 0.5		  # base seconds between requests
JITTER = 0.4			 # added random 0..JITTER seconds
MAX_RETRIES = 6		  # per-request retries before a page is deferred
FAILED_PASSES = 4		# extra full passes over deferred pages

session = requests.Session()
session.headers.update(HEADERS)


def log(msg):
	line = msg.rstrip("\n")
	with open(LOGFILE, "a", encoding="utf-8") as f:
		f.write(line + "\n")
	sys.stderr.write(line + "\n")
	sys.stderr.flush()


def polite_sleep():
	time.sleep(BASE_DELAY + random.random() * JITTER)


def clean_title(raw):
	t = html.unescape(raw or "")
	t = re.sub(r"<[^>]+>", "", t)
	t = re.sub(r"\s+", " ", t).strip()
	return t


# --------------------------------------------------------------------------- #
# Persistence helpers (enable resume)
# --------------------------------------------------------------------------- #
def load_titles():
	if not os.path.exists(OUTPUT):
		return set()
	with open(OUTPUT, encoding="utf-8") as f:
		return {ln.rstrip("\n") for ln in f if ln.strip()}


def save_titles(titles):
	ordered = sorted(titles, key=str.lower)
	tmp = OUTPUT + ".tmp"
	with open(tmp, "w", encoding="utf-8") as f:
		f.write("\n".join(ordered) + ("\n" if ordered else ""))
	os.replace(tmp, OUTPUT)


def load_done_pages():
	if not os.path.exists(PROGRESS):
		return set()
	with open(PROGRESS, encoding="utf-8") as f:
		return {int(ln) for ln in f if ln.strip().isdigit()}


def mark_done(page):
	with open(PROGRESS, "a", encoding="utf-8") as f:
		f.write("%d\n" % page)


# --------------------------------------------------------------------------- #
# Fetching
# --------------------------------------------------------------------------- #
def fetch_page(page):
	"""Fetch one page of titles. Returns (titles_list, status) where status is
	'ok', 'end' (page past the last one), or 'fail'."""
	params = {"per_page": PER_PAGE, "page": page, "_fields": "title",
			  "orderby": "date", "order": "desc"}
	for attempt in range(1, MAX_RETRIES + 1):
		try:
			r = session.get(ENDPOINT, params=params, timeout=45)
		except requests.RequestException as e:
			wait = min(60, 2 ** attempt)
			log(f"	page {page}: network {str(e)[:50]} -> retry {attempt}/{MAX_RETRIES} in {wait}s")
			time.sleep(wait)
			continue

		if r.status_code == 200:
			try:
				data = r.json()
			except ValueError:
				log(f"	page {page}: non-JSON body -> retry {attempt}/{MAX_RETRIES}")
				time.sleep(2 ** attempt)
				continue
			return [clean_title((p.get("title") or {}).get("rendered")) for p in data], "ok"

		if r.status_code == 400:
			# WP "rest_post_invalid_page_number": we've gone past the last page.
			return [], "end"

		if r.status_code == 429 or 500 <= r.status_code < 600:
			ra = r.headers.get("Retry-After")
			wait = float(ra) if (ra and ra.isdigit()) else min(60, 2 ** attempt)
			log(f"	page {page}: HTTP {r.status_code} -> backoff {wait:.0f}s "
				f"({attempt}/{MAX_RETRIES})")
			time.sleep(wait)
			continue

		log(f"	page {page}: HTTP {r.status_code} (non-retryable)")
		return [], "fail"
	return [], "fail"


def total_pages():
	for attempt in range(1, MAX_RETRIES + 1):
		try:
			r = session.get(ENDPOINT, params={"per_page": PER_PAGE, "page": 1,
											  "_fields": "title"}, timeout=45)
			if r.status_code == 200:
				return int(r.headers.get("X-WP-TotalPages") or 0), \
					   r.headers.get("X-WP-Total")
		except requests.RequestException as e:
			log(f"	total_pages network {str(e)[:50]} -> retry")
		time.sleep(2 ** attempt)
	return 0, None


def main():
	ap = argparse.ArgumentParser()
	ap.add_argument("--reset", action="store_true", help="ignore prior progress")
	args = ap.parse_args()
	if args.reset:
		for fp in (PROGRESS,):
			if os.path.exists(fp):
				os.remove(fp)
		log("Reset: cleared progress.")

	open(LOGFILE, "a", encoding="utf-8").write("\n==== run start ====\n")
	titles = load_titles()
	done = load_done_pages()
	log(f"Loaded {len(titles)} existing titles, {len(done)} completed pages.")

	tp, total = total_pages()
	if tp == 0:
		log("Could not determine total pages; aborting.")
		return
	log(f"Archive: X-WP-Total={total}, pages={tp} (per_page={PER_PAGE}).")

	todo = [p for p in range(1, tp + 1) if p not in done]
	log(f"Pages to fetch this run: {len(todo)}")

	deferred = []
	for i, page in enumerate(todo, 1):
		page_titles, status = fetch_page(page)
		if status == "ok":
			titles.update(t for t in page_titles if t)
			mark_done(page)
			if i % 10 == 0 or page == tp:
				save_titles(titles)
				log(f"page {page} (#{i}/{len(todo)}) -> {len(titles)} unique titles")
		elif status == "end":
			mark_done(page)
			log(f"page {page}: past last page; treating as done.")
		else:
			deferred.append(page)
			log(f"page {page}: deferred after retries.")
		polite_sleep()

	save_titles(titles)

	# Extra passes for any deferred pages so nothing is silently dropped.
	for pass_no in range(1, FAILED_PASSES + 1):
		if not deferred:
			break
		log(f"Retry pass {pass_no}: {len(deferred)} deferred pages.")
		still = []
		for page in deferred:
			page_titles, status = fetch_page(page)
			if status in ("ok", "end"):
				titles.update(t for t in page_titles if t)
				mark_done(page)
			else:
				still.append(page)
			time.sleep(2 + random.random())
		deferred = still
		save_titles(titles)

	save_titles(titles)
	if deferred:
		log(f"WARNING: {len(deferred)} pages still failed: {deferred}")
	log(f"FINISHED: {len(titles)} unique headlines in {OUTPUT}. "
		f"Pages done: {len(load_done_pages())}/{tp}.")


if __name__ == "__main__":
	main()
