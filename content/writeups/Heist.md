```json
Alias: Heist
Date: 12-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.129.96.157
```

# Heist
# Summary

- Heist is an easy difficulty Windows box with an Issues portal accessible on the web server, from which it is possible to gain Cisco password hashes. These hashes are cracked, and subsequently RID bruteforce and password spraying are used to gain a foothold on the box. The user is found to be running Firefox. The firefox.exe process can be dumped and searched for the administrator's password.

# Used Tools

* Procdump
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-12 05:10 PKT
Nmap scan report for 10.129.96.157
Host is up (1.3s latency).
Not shown: 996 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods:
|_  Potentially risky methods: TRACE
| http-title: Support Login Page
|_Requested resource was login.php
| http-cookie-flags:
|   /:
|     PHPSESSID:
|_      httponly flag not set
|_http-server-header: Microsoft-IIS/10.0
135/tcp  open  msrpc         Microsoft Windows RPC
445/tcp  open  microsoft-ds?
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
| smb2-time:
|   date: 2024-08-12T00:12:31
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 185.61 seconds
```

---
# Enumeration

After logging in to the website as guest, we find a conversation where someone shared their config file, Which has a hash inside of type CISCO-IOS MD5, crack it. We can also read the comment about hazard asking for an account on the windows server, so we have these creds

| Username | Password      |
| -------- | ------------- |
| hazard   | stealth1agent |

---

# Exploitation

Next we will perform a rid brute and do a password spray against the reversible type 7 password we found in the attachment. with the we get these credentials

| Username | Password         |
| -------- | ---------------- |
| Chase    | Q4)sJu\Y8qz*A3?d |

---

# Privilege Escalation

Since Firefox is running on the machine we can try pillaging it. First we do a memory dump using procdump

`procdump -ma 1659 firefox.dmp`

The file takes way too long to download with evil-winrm since it's around 500 MBs. So It's best to setup a smbserver and then cp the file to it.

When we logged in to the website, we had a parameter called login_username, so try searching for it in the dump

`strings | grep login_user`

and you will get the admin password

| Username      | Password         |
| ------------- | ---------------- |
| administrator | 4dD!5}x/re8]FBuZ |
Then psexec to get the flag

`psexec.py administrator:4dD!5}x/re8]FBuZ@10.129.243.161`

---

# Flags
- 29bcd7c38aa5d294e87b7c4b324ac413
- 7bdb5a71cc863cd3f124b7384cac6e6e

#CTF #CTF/Hackthebox  #CTF/Hackthebox/Easy #Pillaging