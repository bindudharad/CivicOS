"""Create one CivicOS user without storing a password in source control."""
import getpass
from src.config import OPERATIONS_DB_PATH
from src.operations.service import OperationsService
from src.security.auth import AuthService, ROLES

OperationsService(OPERATIONS_DB_PATH)
username = input("Username: ").strip()
password = getpass.getpass("Password (12+ characters): ")
role = input(f"Role {sorted(ROLES)}: ").strip()
AuthService(OPERATIONS_DB_PATH).create_user(username, password, role)
print(f"Created {role} user '{username}'.")
