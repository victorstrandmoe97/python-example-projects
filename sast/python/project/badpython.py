# secrets.py
import os
import hashlib

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
# === MCP FIX START (python.lang.security.audit.eval-detected.eval-detected) ===
# Severity: WARNING
 VULN:  
eval(user_input) + 
# === MCP FIX START (python.lang.security.audit.md5-used-as-password.md5-used-as-password) ===
# Severity: WARNING
 VULN:  
  + 
 
 FIX:  
hashed_password = hashlib.md5(password.encode()).hexdigest()

The vulnerable code uses the MD5 hash function to hash the password. This is not considered secure for password storage due to the ease of cracking MD5 hashes. Instead, a secure password hashing function such as scrypt should be used.

The minimal fix is to use the `hashlib.scrypt` function to hash the password instead of `hashlib.md5`. This ensures that the password is securely hashed using a strong password hashing function + 
 
# === MCP FIX END ===
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
