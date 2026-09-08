from core.auth import fill_missing_email_claim


def test_fill_missing_email_claim_uses_upn():
    claims = {"upn": "user@example.org"}

    validated_claims = fill_missing_email_claim(claims)

    assert validated_claims["email"] == "user@example.org"


def test_fill_missing_email_claim_preserves_email():
    claims = {
        "upn": "sign-in@example.org",
        "email": "mailbox@example.org",
    }

    validated_claims = fill_missing_email_claim(claims)

    assert validated_claims["email"] == "mailbox@example.org"


def test_fill_missing_email_claim_does_nothing_without_upn():
    claims = {"oid": "12345"}

    validated_claims = fill_missing_email_claim(claims)

    assert "email" not in validated_claims
