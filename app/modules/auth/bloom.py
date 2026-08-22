import hashlib
import math
from threading import RLock
from typing import Iterable


class UsernameBloomFilter:
    """Memory-efficient negative lookup cache for normalized usernames.

    A positive result is only "possibly present" and must be confirmed against
    PostgreSQL. A negative result is safe to use as a fast availability hint;
    the database unique constraint remains the final authority during signup.
    """

    def __init__(self, capacity: int = 1_000_000, error_rate: float = 0.01):
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        if not 0 < error_rate < 1:
            raise ValueError("error_rate must be between 0 and 1")

        bit_count = math.ceil(
            -(capacity * math.log(error_rate)) / (math.log(2) ** 2)
        )
        self._bit_count = max(8, bit_count)
        self._hash_count = max(
            1, round((self._bit_count / capacity) * math.log(2))
        )
        self._bits = bytearray(math.ceil(self._bit_count / 8))
        self._lock = RLock()
        self._ready = False

    @property
    def ready(self) -> bool:
        return self._ready

    def _indexes(self, value: str):
        digest = hashlib.sha256(value.encode("utf-8")).digest()
        first = int.from_bytes(digest[:16], "big")
        second = int.from_bytes(digest[16:], "big") or 1
        for index in range(self._hash_count):
            yield (first + index * second) % self._bit_count

    def add(self, value: str) -> None:
        with self._lock:
            for bit_index in self._indexes(value):
                byte_index, offset = divmod(bit_index, 8)
                self._bits[byte_index] |= 1 << offset

    def might_contain(self, value: str) -> bool:
        with self._lock:
            return all(
                self._bits[byte_index] & (1 << offset)
                for bit_index in self._indexes(value)
                for byte_index, offset in [divmod(bit_index, 8)]
            )

    def rebuild(self, values: Iterable[str]) -> None:
        with self._lock:
            self._bits = bytearray(len(self._bits))
            for value in values:
                self.add(value)
            self._ready = True


username_index = UsernameBloomFilter()
