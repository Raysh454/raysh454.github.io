```json
Alias: Cascade
Date: 09-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.249.88
```

# Cascade
# Summary

- Cascade is a medium difficulty Windows machine configured as a Domain Controller. LDAP anonymous binds are enabled, and enumeration yields the password for user `r.thompson`, which gives access to a `TightVNC` registry backup. The backup is decrypted to gain the password for `s.smith`. This user has access to a .NET executable, which after decompilation and source code analysis reveals the password for the `ArkSvc` account. This account belongs to the `AD Recycle Bin` group, and is able to view deleted Active Directory objects. One of the deleted user accounts is found to contain a hardcoded password, which can be reused to login as the primary domain administrator.

# Used Tools

* ILSpy
 
---

# Information Gathering
## NMAP
```
Nmap scan report for 10.129.249.88
Host is up (0.26s latency).
Not shown: 985 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Microsoft DNS 6.1.7601 (1DB15D39) (Windows Server 2008 R2 SP1)
| dns-nsid:
|_  bind.version: Microsoft DNS 6.1.7601 (1DB15D39)
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-08 21:23:05Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: cascade.local, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: cascade.local, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49154/tcp open  msrpc         Microsoft Windows RPC
49155/tcp open  msrpc         Microsoft Windows RPC
49157/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49158/tcp open  msrpc         Microsoft Windows RPC
49165/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: CASC-DC1; OS: Windows; CPE: cpe:/o:microsoft:windows_server_2008:r2:sp1, cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   2:1:0:
|_    Message signing enabled and required
| smb2-time:
|   date: 2024-08-08T21:24:00
|_  start_date: 2024-08-08T21:02:06

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 131.69 seconds
```
## Discovered Subdomains
```
cascade.local
```

---
# Enumeration

The account r.thompson has an attribute called cascadeLegacyPwd which contains his base64 encoded password.

| Username   | Password |
| ---------- | -------- |
| r.thompson | rY4n5eva |

---

# Lateral Movement

With r.thompson user we can get access to the Data share. Inside Data/IT/Temp/s.smith. There is a registry file to setup TightVNC that contains a password. Write the password bytes to a file and we can decrypt using [vncpwd](https://github.com/jeroennijhof/vncpwd)

After decrypting we get the credentials for s.steve

| Username | Password |
| -------- | -------- |
| s.steve  | sT333ve2 |

Get the files from Audit share, decompile using ILSpy or any other tool of your choice. you will find the credential for ArkSvc

| Username | Password      |
| -------- | ------------- |
| ArkSvc   | w3lc0meFr31nd |

---

# Privilege Escalation

Login as ArkSvc, notice we are part of AD Recycle Bin group. Get attributes of Deleted Temp Admin
```powershell
Get-ADObject -ldapfilter "(&(objectclass=user)(DisplayName=TempAdmin)(isDeleted=TRUE))" -IncludeDeletedObjects -Properties *
```

Get the b64 encoded password from CascadeLegacypwd

| Username      | Password        |
| ------------- | --------------- |
| Administrator | baCT3r1aN00dles |

Psexec and get flags
`psexec.py administrator:'baCT3r1aN00dles'@$IP`

---

# Flags
- 26e08a84b8964c50989ec20c6ba7f7a2
- ad9fc412c9a118ac359fdb9bc457501c

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #ActiveDirectory #Reversing