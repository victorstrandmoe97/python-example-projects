# secrets.py
import os
import hashlib

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
# === MCP FIX START (python.lang.security.audit.eval-detected.eval-detected) ===
# Severity: WARNING
eval(user_input)
# → Suggested secure fix:
Corrected line:
# Replace eval(user_input) with a secure alternative
# For example, using ast.literal_eval() to safely evaluate a literal structure
import ast
secure_eval = ast.literal_eval(user_input)
```

# === MCP FIX START (python.lang.security.audit.md5-used-as-password.md5-used-as-password) ===
# Severity: WARNING
In the solution, the `ast.literal_eval()` function is used to safely evaluate
# → Suggested secure fix:
the string representation of the code snippet. This ensures that the code snippet is treated as a literal and not as a part of the Python code. The `hashlib.md5()` function is then used to calculate the MD5 hash of the password. The hash is then stored in the `password_hash` variable. Finally, the corrected code snippet is returned.
# === MCP FIX END ===
# === MCP FIX END ===


print("application")
print("doing")
print("things")




# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()()
