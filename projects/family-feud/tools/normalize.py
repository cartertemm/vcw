#!/usr/bin/env python
"""Normalize the Family Feud Question Database workbook into game JSON.

Reads the multi-sheet Excel database and writes three files to data/:
  - questions.json   scored main-game questions (answers carry survey points)
  - no-points.json   questions whose answers lack survey values
  - fast-money.json  Fast Money prompts (one or two recorded answers each)
"""

import json
import re
import openpyxl
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
WORKBOOK = ROOT / "Family Feud Question Database.xlsx"
DATA = ROOT / "data"

PAIRED_SHEETS = {"3 Answers", "4 Answers", "5 Answers", "6 Answers", "7 Answers", "Sheet1"}
NOPOINTS_SHEETS = {"No Points 3", "No Points 4", "No Points 5", "No Points 6", "No Points 7"}
FASTMONEY_SHEETS = {"Fast Money", "Broken Fast Money"}

# Some cells are double-encoded as UTF-8 and Windows-1252
MOJIBAKE = [
	("â€™", "'"),
	("â€œ", '"'),
	("â€¦", "..."),
	("â€", '"'),
]

TRANSLATION = {
	0x2018: "'", 0x2019: "'",
	0x201c: '"', 0x201d: '"',
	0x2032: "'", 0x2033: '"',
	0x2013: "-", 0x2014: "-",
	0x2026: "...",
	0x00a0: " ",
}


def clean_text(value):
	if value is None:
		return None
	if isinstance(value, float):
		return str(int(value)) if value.is_integer() else str(value)
	if isinstance(value, int):
		return str(value)
	text = str(value)
	for run, repl in MOJIBAKE:
		text = text.replace(run, repl)
	text = text.translate(TRANSLATION)
	text = re.sub(r"\s+", " ", text).strip()
	return text or None


def to_points(value):
	if value is None:
		return None
	try:
		return int(round(float(value)))
	except (TypeError, ValueError):
		return None


def parse_paired(row):
	question = clean_text(row[0])
	if not question:
		return None
	answers = []
	for i in range(1, len(row), 2):
		text = clean_text(row[i])
		points = to_points(row[i + 1]) if i + 1 < len(row) else None
		if text:
			answers.append({"text": text, "points": points})
	if not answers:
		return None
	return {"question": question, "answers": answers}


def parse_nopoints(row):
	question = clean_text(row[0])
	if not question:
		return None
	answers = [{"text": clean_text(c), "points": None} for c in row[1:] if clean_text(c)]
	if not answers:
		return None
	return {"question": question, "answers": answers}


def dedupe(items):
	seen = set()
	out = []
	for item in items:
		key = item["question"].casefold()
		if key in seen:
			continue
		seen.add(key)
		out.append(item)
	return out


def main():
	wb = openpyxl.load_workbook(WORKBOOK, read_only=True, data_only=True)
	scored, nopoints, fastmoney = [], [], []
	for ws in wb.worksheets:
		rows = list(ws.iter_rows(values_only=True))[1:]
		for row in rows:
			if not row or row[0] in (None, ""):
				continue
			if ws.title in PAIRED_SHEETS:
				parsed = parse_paired(row)
				if parsed:
					scored.append(parsed)
			elif ws.title in FASTMONEY_SHEETS:
				parsed = parse_paired(row)
				if parsed:
					fastmoney.append(parsed)
			elif ws.title in NOPOINTS_SHEETS:
				parsed = parse_nopoints(row)
				if parsed:
					nopoints.append(parsed)

	scored = dedupe(scored)
	nopoints = dedupe(nopoints)
	fastmoney = dedupe(fastmoney)

	DATA.mkdir(exist_ok=True)
	for name, items in (("questions", scored), ("no-points", nopoints), ("fast-money", fastmoney)):
		path = DATA / f"{name}.json"
		path.write_text(json.dumps(items, ensure_ascii=False, indent=0), encoding="utf-8")
		print(f"{name}.json: {len(items)} questions")


if __name__ == "__main__":
	main()
