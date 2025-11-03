# secrets.py
import os
import hashlib

# 🚨 Hardcoded API key (should trigger p/secrets)
API_KEY = "cbc68b07-cc5a-4bfb-827b-97c31807c913"

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
eval(user_input)
# MCP-LMM-FIX (python.lang.security.audit.eval-detected.eval-detected): Detected the use of eval(). eval() can be dangerous if used to evaluate dynamic content. If this content can be input from outside the program, this may be a code injection vulnerability. Ensure evaluated content is not definable by external sources.
# 🚨 Insecure file handling
with open("config.json", "r") as f:
    config = json.load(f)

# 🚨 Insecure file handling (overwriting)
# MCP-LMM-FIX (python.lang.security.audit.md5-used-as-password.md5-used-as-password): It looks like MD5 is used as a password hash. MD5 is not considered a secure password hash because it can be cracked by an attacker in a short amount of time. Use a suitable password hashing function such as scrypt. You can use `hashlib.scrypt`.
# 🚨 Insecure crypto usage (CBC mode)
cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
encryptor = cipher.encryptor()
ciphertext = encryptor.update(b"secret data") + encryptor.finalize()

# 🚨 Insecure crypto usage (CBC mode with IV reuse)
cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
encryptor = cipher.encryptor()
ciphertext = encryptor.update(b"secret data") + encryptor.finalize()

# 🚨 Insecure crypto usage (CBC mode with IV leakage)
cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
encryptor = cipher.encryptor()
ciphertext = encryptor.update(b"secret data") + encryptor.finalize()

# 🚨 Insecure crypto usage (CBC mode with IV predictability)
cipher =
with open("config.json", "w") as f:
    json.dump(config, f)

# 🚨 Insecure file handling (appending)
with open("log.txt", "a") as f:
    f.write("Error: " + str(error) + "\n")

# 🚨 Insecure file handling (overwriting)
with open("flag.txt", "w") {
    flag = "FLAG{...}"
    with open("flag.txt", "w") as f:
        f.write(flag)

# 🚨 Insecure file handling (appending)
with open("flag.txt", "a") {
    flag += "..."
    with open("flag.txt", "a") as f:
        f.write(flag)

# 🚨 Insecure file handling (overwriting)

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
