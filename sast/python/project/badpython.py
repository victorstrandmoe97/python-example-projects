# secrets.py
import os
import hashlib

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
# === MCP FIX START (python.lang.security.audit.eval-detected.eval-detected) ===
eval(user_input)
# → Suggested secure fix:
```

The `eval(user_input)` line is vulnerable to code injection attacks, and should be replaced with `ast.literal_eval(user_input)` to securely evaluate the input.

The `child_process.exec('rm -rf'+ path)` line is also vulnerable to command injection attacks, and should be replaced with `child_
# === MCP FIX END ===


print("application")
print("doing")
print("things")




# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()()
