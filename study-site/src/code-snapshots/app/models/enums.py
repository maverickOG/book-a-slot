from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    PROVIDER = "provider"
    CUSTOMER = "customer"


class BookingStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"