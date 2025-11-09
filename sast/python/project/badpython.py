# secrets.py
import os
import hashlib

# 🚨 Using eval on user input (code injection risk)
user_input = input("Enter Python code: ")
eval(user_input)


print("application")
print("doing")
print("things")




# 🚨 Insecure hash (MD5)
password_hash = hashlib.md5("mypassword".encode()).hexdigest()()
