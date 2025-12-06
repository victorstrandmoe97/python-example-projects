# secrets.py
import os
import hashlib

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
# === MCP FIX START (python.lang.security.audit.eval-detected.eval-detected) ===
# Severity: WARNING
eval(user_input)
# → Suggested secure fix:
Corrected code:
ast.literal_eval(user_input)
Explanation:
ast.literal_eval() is a safer alternative to eval() for safely evaluating literal structures like lists, tuples, dictionaries, and booleans. It prevents the evaluation of arbitrary code and ensures that only the defined structures can be created.

#
# === MCP FIX END ===
# === MCP FIX START (python.lang.security.audit.md5-used-as-password.md5-used-as-password) ===
# Severity: WARNING

# → Suggested secure fix:
# Corrected code:
import hashlib

# Example usage:
password = "mysecurepassword"
salt = b"somesalt"
hashed_password = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
print(hashed_password)
```
# === MCP FIX END ===

print("application")
print("doing")
print("things")




# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()()
