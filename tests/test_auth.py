import time
import unittest
import ssl
from types import SimpleNamespace
from unittest.mock import patch

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from main import app


class AuthenticationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        cls.client = TestClient(app)

    def token(self, **changes):
        claims = dict(
            sub="auth0|test",
            iss="https://test.auth0.com/",
            aud="lingo",
            iat=int(time.time()),
            exp=int(time.time()) + 300,
        )
        claims.update(changes)
        return jwt.encode(claims, self.key, algorithm="RS256")

    def request(self, token):
        return self.client.get("/api/me", headers={"Authorization": "Bearer " + token})

    def test_health_public_and_practice_protected(self):
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        for route in (
            "placement-test",
            "session",
            "studio-session",
            "analyze-speech",
            "analyze-recording",
        ):
            self.assertEqual(
                self.client.post("/api/" + route, json={}).status_code, 401
            )
        # Recording routes spend ElevenLabs credits, so they must be protected too.
        for route in ("analyze-recording", "check-stress"):
            self.assertEqual(self.client.post("/api/" + route).status_code, 401)
        self.assertEqual(self.client.get("/api/me").status_code, 401)

    @patch("auth.settings")
    def test_signed_tokens_and_claim_validation(self, settings):
        keys = SimpleNamespace(
            get_signing_key_from_jwt=lambda _: SimpleNamespace(
                key=self.key.public_key()
            )
        )
        settings.return_value = ("https://test.auth0.com/", "lingo", keys)
        self.assertEqual(self.request(self.token()).json(), {"sub": "auth0|test"})
        for changes in (
            {"aud": "wrong"},
            {"iss": "https://wrong/"},
            {"exp": 1},
            {"sub": ""},
            {"iat": int(time.time()) + 600},
        ):
            self.assertEqual(self.request(self.token(**changes)).status_code, 401)
        self.assertEqual(self.request("malformed").status_code, 401)
        other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        forged = jwt.encode(
            dict(
                sub="attacker",
                aud="lingo",
                iss="https://test.auth0.com/",
                iat=int(time.time()),
                exp=int(time.time()) + 300,
            ),
            other,
            algorithm="RS256",
        )
        self.assertEqual(self.request(forged).status_code, 401)
        headers = {"Authorization": "Bearer " + self.token()}
        for route, body in [
            ("placement-test", {"correct": 3}),
            ("session", {"game": "stress-sort", "correct": 2, "total": 3}),
            ("analyze-speech", {"text": "hello"}),
        ]:
            self.assertEqual(
                self.client.post(
                    "/api/" + route, json=body, headers=headers
                ).status_code,
                200,
            )

    @patch("auth.settings")
    def test_key_service_failure(self, settings):
        keys = unittest.mock.Mock()
        keys.get_signing_key_from_jwt.side_effect = jwt.PyJWKClientConnectionError(
            "offline"
        )
        settings.return_value = ("https://test.auth0.com/", "lingo", keys)
        self.assertEqual(self.request(self.token()).status_code, 503)

    def test_missing_configuration(self):
        from auth import settings

        settings.cache_clear()

    def test_jwks_client_uses_bundled_ca_certificates(self):
        from auth import settings

        settings.cache_clear()
        with patch("auth.jwt.PyJWKClient") as client:
            with patch.dict(
                "os.environ",
                {"AUTH0_DOMAIN": "test.auth0.com", "AUTH0_AUDIENCE": "lingo"},
            ):
                settings()
        context = client.call_args.kwargs["ssl_context"]
        self.assertIsInstance(context, ssl.SSLContext)
        self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
        self.assertTrue(context.check_hostname)
        self.assertGreater(context.cert_store_stats()["x509_ca"], 0)
        settings.cache_clear()
        with patch.dict("os.environ", {"AUTH0_DOMAIN": "", "AUTH0_AUDIENCE": ""}):
            self.assertEqual(self.request(self.token()).status_code, 503)
        settings.cache_clear()


if __name__ == "__main__":
    unittest.main()
