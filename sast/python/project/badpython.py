# secrets.py
import os
import hashlib

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
# === MCP FIX START (python.lang.security.audit.eval-detected.eval-detected) ===
# Severity: WARNING
eval(user_input)
# → Suggested secure fix:
def eval_example():
    user_input = input("Enter a Python expression: ")
    eval(user_input)


# Example usage
eval_example()
```

In this example, the `eval_example` function takes user input and
# === MCP FIX END ===


# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()


key = b"1234567890123456"
iv = b"0000000000000000"
cipher = Cipher(algorithms.AES(key), modes.ECB())  # ECB mode is insecure
encryptor = cipher.encryptor()
ciphertext = encryptor.update(b"secret data") + encryptor.finalize()
