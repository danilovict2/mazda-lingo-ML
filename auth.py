"""Validate Auth0 access tokens; never trust identity supplied in request bodies."""
import os
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer = HTTPBearer(auto_error=False)


@lru_cache
def settings():
    domain = os.getenv("AUTH0_DOMAIN", "").strip()
    audience = os.getenv("AUTH0_AUDIENCE", "").strip()
    if not domain or any(c in domain for c in "/:#?@") or not audience:
        raise HTTPException(503, "Authentication is not configured")
    issuer = f"https://{domain}/"
    return issuer, audience, jwt.PyJWKClient(issuer + ".well-known/jwks.json", timeout=5)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if credentials is None:
        raise HTTPException(401, "Authentication required", headers={"WWW-Authenticate": "Bearer"})
    issuer, audience, keys = settings()
    try:
        key = keys.get_signing_key_from_jwt(credentials.credentials)
        claims = jwt.decode(
            credentials.credentials, key.key, algorithms=["RS256"],
            audience=audience, issuer=issuer,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
        )
        if not isinstance(claims["sub"], str) or not claims["sub"]:
            raise jwt.InvalidTokenError("Missing subject")
        return claims
    except jwt.PyJWKClientConnectionError:
        raise HTTPException(503, "Authentication service unavailable") from None
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired access token", headers={"WWW-Authenticate": "Bearer"}) from None
