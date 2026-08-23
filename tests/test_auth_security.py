import unittest

from app.common.jwt import (
    create_email_verification_token,
    create_google_selection_token,
    decode_token,
)
from app.common.otp import hash_otp, verify_otp_hash


class AuthSecurityTests(unittest.TestCase):
    def test_email_verification_token_has_a_separate_purpose(self):
        token = create_email_verification_token("Aditi@Example.com")

        payload = decode_token(token, "email_verification")
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], "aditi@example.com")
        self.assertIsNone(decode_token(token, "access"))

    def test_otp_hash_is_bound_to_email_and_code(self):
        digest = hash_otp("aditi@example.com", "123456")

        self.assertTrue(verify_otp_hash("aditi@example.com", "123456", digest))
        self.assertFalse(verify_otp_hash("other@example.com", "123456", digest))
        self.assertFalse(verify_otp_hash("aditi@example.com", "654321", digest))

    def test_google_account_selection_token_is_short_lived_and_scoped(self):
        token = create_google_selection_token("Aditi@Example.com", "google-user-123")

        payload = decode_token(token, "google_account_selection")
        self.assertIsNotNone(payload)
        self.assertEqual(payload["email"], "aditi@example.com")
        self.assertEqual(payload["sub"], "google-user-123")
        self.assertIsNone(decode_token(token, "access"))


if __name__ == "__main__":
    unittest.main()
