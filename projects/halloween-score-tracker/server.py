import csv
import json
import os
import socket
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "teams.csv"
FIELDS = ["name", "color", "score"]
HOST = "0.0.0.0"
PORT = 8000
API_PATH = "/api/teams"
SOUNDS_API_PATH = "/api/sounds"
SOUND_DIR = ROOT / "sounds"
SOUND_SIDES = ("plus", "minus")
SOUND_TYPES = {".ogg", ".mp3", ".wav", ".m4a", ".flac"}


def parse_score(value):
	try:
		return max(0, int(value))
	except (TypeError, ValueError):
		return 0


def read_teams():
	if not CSV_PATH.exists():
		return []
	with CSV_PATH.open(newline="", encoding="utf-8") as f:
		return [
			{"name": row["name"].strip(), "color": (row.get("color") or "").strip(), "score": parse_score(row.get("score"))}
			for row in csv.DictReader(f)
			if (row.get("name") or "").strip()
		]


def write_teams(teams):
	temp_path = CSV_PATH.with_suffix(".tmp")
	with temp_path.open("w", newline="", encoding="utf-8") as f:
		writer = csv.DictWriter(f, fieldnames=FIELDS)
		writer.writeheader()
		for team in teams:
			writer.writerow({"name": team["name"], "color": team["color"], "score": team["score"]})
	os.replace(temp_path, CSV_PATH)


def list_sounds():
	return {
		side: sorted(f"sounds/{side}/{path.name}" for path in (SOUND_DIR / side).glob("*") if path.suffix.lower() in SOUND_TYPES)
		for side in SOUND_SIDES
	}


def lan_address():
	with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
		try:
			probe.connect(("10.255.255.255", 1))
			return probe.getsockname()[0]
		except OSError:
			return None


class Handler(SimpleHTTPRequestHandler):
	def send_json(self, status, data):
		body = json.dumps(data).encode("utf-8")
		self.send_response(status)
		self.send_header("Content-Type", "application/json")
		self.send_header("Content-Length", str(len(body)))
		self.end_headers()
		self.wfile.write(body)

	def do_GET(self):
		if self.path == API_PATH:
			self.send_json(200, read_teams())
		elif self.path == SOUNDS_API_PATH:
			self.send_json(200, list_sounds())
		else:
			super().do_GET()

	def do_PUT(self):
		if self.path != API_PATH:
			self.send_json(404, {"error": "not found"})
			return
		try:
			length = int(self.headers.get("Content-Length", 0))
			data = json.loads(self.rfile.read(length))
			teams = [
				{"name": str(team["name"]).strip(), "color": str(team.get("color", "")).strip(), "score": parse_score(team.get("score"))}
				for team in data
				if str(team["name"]).strip()
			]
		except (ValueError, KeyError, TypeError):
			self.send_json(400, {"error": "invalid team list"})
			return
		write_teams(teams)
		self.send_json(200, teams)


if __name__ == "__main__":
	server = HTTPServer((HOST, PORT), partial(Handler, directory=str(ROOT)))
	print(f"Halloween Score Tracker running at http://localhost:{PORT}")
	address = lan_address()
	if address:
		print(f"On other devices on this network, open http://{address}:{PORT}")
	print(f"Saving teams to {CSV_PATH}")
	try:
		server.serve_forever()
	except KeyboardInterrupt:
		pass
