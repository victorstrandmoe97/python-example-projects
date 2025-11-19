# Sandbox Inspection Report (Wed-19-Nov-2025-1255UTC-001)

**Time:** 2025-11-19 12:57:39 UTC

**Sandbox Status:** failed-high

**Exit Code:** 2

## Raw Output

```
### STDOUT
{
  "keywords": {
    "found": [
      "urllib",
      "use",
      "code",
      "vulnerable",
      "line",
      "examples",
      "input",
      "output",
      "path",
      "detected",
      "dynamic",
      "value",
      "context",
      "secure",
      "assistant",
      "rewrite",
      "given",
      "securely",
      "guidance",
      "eval(user_input"
    ],
    "missing": []
  },
  "findings": [
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/main.py",
      "line": 39,
      "excerpt": "response = requests.post(url, headers=headers, json=payload)"
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/update_run_audit.py",
      "line": 45,
      "excerpt": "response = requests.post(url, json=payload, headers=headers)"
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/upload_blob_storage.py",
      "line": 25,
      "excerpt": "resp = requests.post("
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/upload_blob_storage.py",
      "line": 48,
      "excerpt": "put_resp = requests.put("
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/upload_blob_storage.py",
      "line": 59,
      "excerpt": "resp_read = requests.post("
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/complete_run_audit.py",
      "line": 90,
      "excerpt": "response = requests.post(url, headers=headers, json=payload)"
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/start_run_audit.py",
      "line": 48,
      "excerpt": "response = requests.post(f\"{SAST_SCAN_RESULT_API_URL}/start_run\", json=payload, headers=headers)"
    },
    {
      "pattern": "python_requests",
      "severity": "medium",
      "description": "Python performs outbound network requests via requests library",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/initialise_run.py",
      "line": 28,
      "excerpt": "resp = requests.post("
    },
    {
      "pattern": "python_eval_exec",
      "severity": "high",
      "description": "Python uses eval/exec, which can execute untrusted code",
      "file": "/tmp/mcp_semgrep_ubp0s5iw/repo/sast/python/project/badpython.py",
      "line": 7,
      "excerpt": "eval(user_input)"
    }
  ],
  "tools": [
    {
      "command": "semgrep --config p/ci /tmp/mcp_semgrep_ubp0s5iw/repo",
      "returncode": "0",
      "output": "\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502 Scan Status \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n  Scanning 75 files tracked by git with 145 Code rules:\n                                                                                                                        \n  Language      Rules   Files          Origin      Rules                                                                \n \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500        \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500                                                               \n  <multilang>       2      72          Community     145                                                                \n  python           19      17                                                                                           \n  terraform         5       6                                                                                           \n  yaml              7       3                                                                                           \n  dockerfile        2       2                                                                                           \n                                                                                                                        \n                \n                \n\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502 Scan Summary \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\nSome files were skipped or only partially analyzed.\n  Scan was limited to files tracked by git.\n  Partially scanned: 1 files only partially analyzed due to parsing or internal Semgrep errors\n  Scan skipped: 3 files larger than 1.0 MB\n  For a full list of skipped files, run semgrep with the --verbose flag.\n\n(need more rules? `semgrep login` for additional free Semgrep Registry rules)\n\nRan 34 rules on 72 files: 0 findings.\n\nA new version of Semgrep is available. See https://semgrep.dev/docs/upgrading\nIf Semgrep missed a finding, please send us feedback to let us know!\nSee https://semgrep.dev/docs/reporting-false-negatives/"
    }
  ]
}

```
