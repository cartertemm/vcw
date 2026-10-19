#!/usr/bin/env python
"""Normalize the Family Feud Question Database workbook into game JSON.

Reads the multi-sheet Excel database and writes two files to data/:
  - questions.json   scored main-game questions (answers carry survey points)
  - no-points.json   questions whose answers lack survey values

Text is fixed with tools/text-fixes.json (typos, point typos, names) and
converted from Title Case to sentence case. Casing needs nltk:
  pip install openpyxl nltk
  python -m nltk.downloader words wordnet
"""

import json
import re
import openpyxl
from pathlib import Path
from nltk.corpus import words, wordnet
from nltk.stem import WordNetLemmatizer

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
WORKBOOK = ROOT / "Family Feud Question Database.xlsx"
DATA = ROOT / "data"
FIXES = json.loads((HERE / "text-fixes.json").read_text(encoding="utf-8"))

PAIRED_SHEETS = {"3 Answers", "4 Answers", "5 Answers", "6 Answers", "7 Answers", "Sheet1"}
NOPOINTS_SHEETS = {"No Points 3", "No Points 4", "No Points 5", "No Points 6", "No Points 7"}

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


QUESTION_WORDS = {"who", "what", "when", "where", "why", "how", "which", "is", "are", "do", "does", "did",
	"can", "could", "would", "will", "should", "have", "has"}
WORD = re.compile(r"[A-Za-z][A-Za-z']*")
CONTRACTION = re.compile(r"(n't|'s|'d|'re|'ve|'ll|'m|s'|')$", re.I)
PLURAL = re.compile(r"(ies|es|s)$")
I_WORDS = re.compile(r"I('m|'d|'ll|'ve)?")
SENTENCE_END = re.compile(r"[.?!:]\s+\W*$")
NAME_JOINERS = {"", "/", "&", "-"}
SHOUTED_WORD = re.compile(r"\b[A-Z]{3,}\b")
ACRONYMS = set(FIXES["acronyms"])
DOUBLE_CAPITAL = re.compile(r"\b([A-Z])([A-Z])([a-z]{2,})\b")
SHOUTED_CONTRACTION = re.compile(r"\b([A-Za-z]+)'(S|D|T|M|LL|RE|VE)\b")
FUNCTION_WORDS = {"who", "what", "which", "that", "the", "a", "an", "and", "or", "of", "to", "in", "on", "for",
	"with", "at", "by", "from", "is", "are", "was", "be", "you", "your", "their", "his", "her", "its", "it", "they",
	"he", "she", "we", "our", "my", "me", "him", "them", "this", "those", "these", "there", "might", "would", "most",
	"do", "does", "did", "have", "has", "had", "can", "will", "should", "could", "may", "not", "when", "where", "why",
	"how", "as", "if", "so", "but", "all", "people"}
TYPOS = FIXES["typos"]
COMMON_EXTRA = set(FIXES["common"])
PROPER_PHRASES = [re.compile(r"\b" + re.escape(p) + r"\b", re.I) for p in FIXES["proper_phrases"]]


def build_vocabulary():
	common, proper = set(), set()
	for w in words.words():
		(common if w.islower() else proper).add(w.lower())
	for synset in wordnet.all_synsets():
		for lemma in synset.lemmas():
			name = lemma.name()
			if "_" not in name:
				(common if name.islower() else proper).add(name.lower())
	return common, proper


COMMON, PROPER = build_vocabulary()
LEMMATIZER = WordNetLemmatizer()


def is_common(token):
	word = token.lower()
	if word in COMMON_EXTRA:
		return True
	base = CONTRACTION.sub("", word) or word
	if base in COMMON:
		return True
	if base in PROPER:
		return False
	if PLURAL.sub("", base) in COMMON:
		return True
	return any(LEMMATIZER.lemmatize(base, pos) in COMMON for pos in "nvar")


def case_word(token, first, neighbors_are_names, is_answer):
	if token[0].islower() and any(c.isupper() for c in token[1:]):
		return token
	if first:
		return token[0].upper() + token[1:]
	if token == "A" or (token.isupper() and token.lower() in FUNCTION_WORDS):
		return token.lower()
	if len(token) == 1 or token.replace("'", "").isupper() or any(c.isupper() for c in token[1:]):
		return token
	if I_WORDS.fullmatch(token) or not token[0].isupper():
		return token
	if not is_common(token):
		return token
	base = CONTRACTION.sub("", token.lower())
	if neighbors_are_names and base not in FUNCTION_WORDS and (is_answer or base in PROPER):
		return token
	return token.lower()


def sentence_case(text, is_answer):
	parts = re.split(r"([A-Za-z][A-Za-z']*)", text)
	tokens = [i for i, part in enumerate(parts) if WORD.fullmatch(part)]
	strong_name = {i: parts[i][0].isupper() and not is_common(parts[i]) for i in tokens}
	first = True
	for n, i in enumerate(tokens):
		gap_before = parts[i - 1]
		if n > 0 and SENTENCE_END.search(gap_before):
			first = True
		neighbors = [tokens[n - 1]] if n > 0 and gap_before.strip() in NAME_JOINERS else []
		if n + 1 < len(tokens) and parts[i + 1].strip() in NAME_JOINERS:
			neighbors.append(tokens[n + 1])
		parts[i] = case_word(parts[i], first, any(strong_name[j] for j in neighbors), is_answer)
		first = False
	result = "".join(parts)
	for pattern, phrase in zip(PROPER_PHRASES, FIXES["proper_phrases"]):
		result = pattern.sub(phrase, result)
	return result


def fix_typos(text):
	for wrong, right in FIXES["phrases"].items():
		text = re.sub(re.escape(wrong), right, text, flags=re.I)
	text = text.replace("`", "")
	if text.isupper() and " " in text:
		text = WORD.sub(lambda m: m.group(0).capitalize(), text)
	text = SHOUTED_WORD.sub(lambda m: m.group(0) if m.group(0) in ACRONYMS or not is_common(m.group(0)) else m.group(0).capitalize(), text)
	text = text.replace("|", "")
	text = DOUBLE_CAPITAL.sub(lambda m: m.group(1) + m.group(2).lower() + m.group(3), text)
	text = SHOUTED_CONTRACTION.sub(lambda m: f"{m.group(1)}'{m.group(2).lower()}", text)
	text = re.sub(r"\s*/\s*", "/", text)
	text = re.sub(r"(?<=[A-Za-z])_(?=[A-Za-z])", "-", text)

	def replace(match):
		token = match.group(0)
		fixed = TYPOS.get(token.lower())
		if fixed is None:
			return token
		if any(c.isupper() for c in fixed) or not token[0].isupper():
			return fixed
		return fixed[0].upper() + fixed[1:]

	return WORD.sub(replace, text).strip()


def fix_text(text, is_answer=False):
	return sentence_case(fix_typos(text), is_answer)


def end_question(text):
	if text[-1] in ".?!)":
		return text
	first_word = text.split()[0].lower()
	return text + ("?" if first_word in QUESTION_WORDS else ".")


def fix_points(item):
	for fix in FIXES["points"]:
		if not item["question"].startswith(fix["question_start"]):
			continue
		for answer in item["answers"]:
			if answer["text"] == fix["answer"] and answer["points"] == fix["from"]:
				answer["points"] = fix["to"]


def finish(item, scored):
	fix_points(item)
	answers, seen = [], set()
	for answer in item["answers"]:
		text = fix_text(answer["text"], is_answer=True)
		if not text or text.casefold() in seen:
			continue
		if scored and answer["points"] is None:
			continue
		seen.add(text.casefold())
		answers.append({"text": text, "points": answer["points"]})
	if scored:
		answers.sort(key=lambda a: -a["points"])
	if not answers:
		return None
	return {"question": end_question(fix_text(item["question"])), "answers": answers}


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
		key = re.sub(r"\W", "", item["question"].casefold())
		if key in seen:
			continue
		seen.add(key)
		out.append(item)
	return out


def main():
	wb = openpyxl.load_workbook(WORKBOOK, read_only=True, data_only=True)
	scored, nopoints = [], []
	for ws in wb.worksheets:
		rows = list(ws.iter_rows(values_only=True))[1:]
		for row in rows:
			if not row or row[0] in (None, ""):
				continue
			if ws.title in PAIRED_SHEETS:
				parsed = parse_paired(row)
				if parsed:
					scored.append(parsed)
			elif ws.title in NOPOINTS_SHEETS:
				parsed = parse_nopoints(row)
				if parsed:
					nopoints.append(parsed)

	scored = dedupe(filter(None, (finish(item, True) for item in scored)))
	nopoints = dedupe(filter(None, (finish(item, False) for item in nopoints)))

	DATA.mkdir(exist_ok=True)
	for name, items in (("questions", scored), ("no-points", nopoints)):
		path = DATA / f"{name}.json"
		path.write_text(json.dumps(items, ensure_ascii=False, indent=0), encoding="utf-8")
		print(f"{name}.json: {len(items)} questions")


if __name__ == "__main__":
	main()
