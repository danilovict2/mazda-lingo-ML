import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

import main
from auth import current_user
from database import Database


class ProgressApiTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.original_db = main.db
        main.db = Database(str(Path(self.tempdir.name) / "api.db"))
        main.app.dependency_overrides[current_user] = lambda: {"sub": "auth0|api-test"}
        self.client = TestClient(main.app)

    def tearDown(self):
        main.app.dependency_overrides.clear()
        self.client.close()
        main.db = self.original_db
        self.tempdir.cleanup()

    def test_complete_progress_lifecycle(self):
        initial = self.client.get("/api/progress")
        self.assertEqual(initial.status_code, 200)
        self.assertEqual(initial.json()["xp"], 360)

        placement = self.client.post(
            "/api/placement-test", json={"correct": 4, "total": 5}
        )
        self.assertEqual(placement.status_code, 200)
        self.assertEqual(placement.json()["level"], "Advanced")

        attempt = "60e07dc0-4b0a-41e8-8716-f16847730d48"
        body = {
            "game": "stress-sort",
            "correct": 4,
            "total": 5,
            "attemptId": attempt,
        }
        first = self.client.post("/api/session", json=body)
        retry = self.client.post("/api/session", json=body)
        self.assertEqual(first.status_code, 200)
        self.assertTrue(first.json()["created"])
        self.assertFalse(retry.json()["created"])
        self.assertEqual(retry.json()["progress"]["xp"], 500)

        studio = self.client.post(
            "/api/studio-session",
            json={
                "score": 82,
                "attemptId": "1bd255f5-c1e5-4db6-aa4e-d761442872ba",
            },
        )
        self.assertEqual(studio.status_code, 200)
        self.assertEqual(studio.json()["progress"]["sessions"][0]["accuracy"], 82)

        reset = self.client.delete("/api/progress")
        self.assertEqual(reset.status_code, 200)
        self.assertEqual(reset.json()["xp"], 360)
        self.assertEqual(reset.json()["sessions"], [])

    def test_rejects_invalid_lessons(self):
        response = self.client.post(
            "/api/session",
            json={"game": "unknown", "correct": 1, "total": 1},
        )
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
