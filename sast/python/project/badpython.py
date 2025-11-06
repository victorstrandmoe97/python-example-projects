# secrets.py
import os
import hashlib

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
# === MCP FIX START (python.lang.security.audit.eval-detected.eval-detected) ===
# Detected the use of eval(). eval() can be dangerous if used to evaluate dynamic content. If this content can be input from outside the program, this may be a code injection vulnerability. Ensure evaluated content is not definable by external sources.
# Severity: WARNING
eval(user_input)
# → Suggested secure fix:
Corrected line:
# Replace eval(user_input) with a secure alternative
# For example, using ast.literal_eval() to safely evaluate a literal structure
import ast
secure_eval = ast.literal_eval(user_input)
```
# === MCP FIX END ===


# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()


key = b"1234567890123456"
iv = b"0000000000000000"
cipher = Cipher(algorithms.AES(key), modes.ECB())  # ECB mode is insecure
encryptor = cipher.encryptor()
ciphertext = encryptor.update(b"secret data") + encryptor.finalize()
