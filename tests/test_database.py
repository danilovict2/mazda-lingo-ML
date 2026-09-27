import tempfile
import unittest
from pathlib import Path

from database import Database


class DatabaseTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.database = Database(str(Path(self.tempdir.name) / "cadence.db"))
        self.database.initialize()

    def tearDown(self):
        self.tempdir.cleanup()

    def test_progress_is_created_and_persisted(self):
        initial = self.database.progress("auth0|learner")
        self.assertEqual(initial["xp"], 360)
        self.assertEqual(initial["completed"], [])

        placed = self.database.save_placement("auth0|learner", "Advanced")
        self.assertTrue(placed["placed"])
        self.assertEqual(placed["level"], "Advanced")

        progress, created = self.database.save_session(
            "auth0|learner",
            attempt_id="attempt-1",
            game="stress-steps",
            name="Stress Steps",
            correct=4,
            total=5,
            xp=140,
        )
        self.assertTrue(created)
        self.assertEqual(progress["xp"], 500)
        self.assertEqual(progress["answers"], 5)
        self.assertEqual(progress["correct"], 4)
        self.assertEqual(progress["completed"], ["stress-steps"])
        self.assertEqual(progress["sessions"][0]["accuracy"], 80)

    def test_attempts_are_idempotent(self):
        arguments = dict(
            attempt_id="same-attempt",
            game="rhythm-echo",
            name="Rhythm Echo",
            correct=3,
            total=4,
            xp=110,
        )
        first, first_created = self.database.save_session("user", **arguments)
        second, second_created = self.database.save_session("user", **arguments)
        self.assertTrue(first_created)
        self.assertFalse(second_created)
        self.assertEqual(first, second)
        self.assertEqual(second["xp"], 470)
        self.assertEqual(len(second["sessions"]), 1)

    def test_reset_cascades_sessions_and_completions(self):
        self.database.save_session(
            "user",
            attempt_id="attempt",
            game="shape-your-sound",
            name="Shape Your Sound",
            correct=0,
            total=0,
            xp=120,
            accuracy=82,
        )
        reset = self.database.reset("user")
        self.assertEqual(reset["xp"], 360)
        self.assertEqual(reset["sessions"], [])
        self.assertEqual(reset["completed"], [])


if __name__ == "__main__":
    unittest.main()
