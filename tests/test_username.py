import unittest

from app.modules.auth.bloom import UsernameBloomFilter
from app.modules.auth.schemas import SignupRequest
from app.modules.auth.username import validate_username


class UsernameRulesTests(unittest.TestCase):
    def test_username_is_normalized(self):
        self.assertEqual(validate_username("  Rahul.Verma_7  "), "rahul.verma_7")

    def test_username_rejects_invalid_boundaries_and_characters(self):
        for value in ("ab", ".rahul", "rahul.", "rahul-verma", "a" * 51):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    validate_username(value)

    def test_fifty_character_username_is_allowed(self):
        self.assertEqual(validate_username("a" * 50), "a" * 50)

    def test_signup_schema_normalizes_username_and_display_name(self):
        request = SignupRequest(
            display_name="  Aditi   Sharma  ",
            username="  Aditi.Sharma ",
            email="aditi@example.com",
            password="strong-password",
            verification_token="verification-token",
        )

        self.assertEqual(request.display_name, "Aditi Sharma")
        self.assertEqual(request.username, "aditi.sharma")


class UsernameBloomFilterTests(unittest.TestCase):
    def test_inserted_names_never_return_negative(self):
        bloom = UsernameBloomFilter(capacity=100, error_rate=0.01)
        names = ["aditi", "rahul.verma", "teacher_12"]
        bloom.rebuild(names)

        self.assertTrue(bloom.ready)
        for name in names:
            with self.subTest(name=name):
                self.assertTrue(bloom.might_contain(name))

    def test_rebuild_replaces_previous_contents(self):
        bloom = UsernameBloomFilter(capacity=100, error_rate=0.0001)
        bloom.rebuild(["old_name"])
        bloom.rebuild(["new_name"])

        self.assertTrue(bloom.might_contain("new_name"))
        self.assertFalse(bloom.might_contain("old_name"))


if __name__ == "__main__":
    unittest.main()
