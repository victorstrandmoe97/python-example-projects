# secrets.py
import os
import hashlib

# 🚨 Hardcoded API key (should trigger p/secrets)
API_KEY = "cbc68b07-cc5a-4bfb-827b-97c31807c913"

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
eval(user_input)

# 🚨 Hardcoded password
DB_PASSWORD = "SuperSecret123!"

# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()

# 🚨 Weak crypto usage
import cryptography
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

key = b"1234567890123456"
iv = b"0000000000000000"
cipher = Cipher(algorithms.AES(key), modes.ECB())  # ECB mode is insecure
encryptor = cipher.encryptor()
ciphertext = encryptor.update(b"secret data") + encryptor.finalize()
