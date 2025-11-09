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

In the solution, the `ast.literal_eval()` function is used to safely evaluate
# === MCP FIX END ===


print("application")
print("doing")
print("things")




# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()()
