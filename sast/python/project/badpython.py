# secrets.py
import os
import hashlib

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
# === MCP FIX START (python.lang.security.audit.eval-detected.eval-detected) ===
# Severity: WARNING
 VULN:  
eval(user_input) + 
 
 FIX:  
The vulnerable code snippet is:
```python
user_input = input("Enter your input: ")
eval(user_input)
```

The minimalist fix is to replace the use of `eval()` with a safer alternative, such as `ast.literal_eval()` or `compile()` to safely evaluate the input. Here's an example using `ast.literal_eval()`:

```python
import ast

user_input = input("Enter your input: ")
safe_output = ast.literal_eval + 
 
# === MCP FIX END ===


# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()


key = b"1234567890123456"
iv = b"0000000000000000"
cipher = Cipher(algorithms.AES(key), modes.ECB())  # ECB mode is insecure
encryptor = cipher.encryptor()
ciphertext = encryptor.update(b"secret data") + encryptor.finalize()
