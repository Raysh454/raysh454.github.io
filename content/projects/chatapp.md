---
title: "ChatApp"
date: "2024-01-14"
summary: "A Python-based client-server chat application with a modern PyQt6 graphical user interface, real-time messaging, and basic account management."
repo: "https://github.com/Raysh454/ChatApp"
---

# ChatApp

A Python-based client-server chat application with a modern PyQt6 graphical user interface, real-time messaging, and basic account management.

## Features

- **User Registration & Login** — Create accounts and securely authenticate.
- **Real-time Messaging** — Send broadcast messages instantly to connected users.
- **User Presence** — See when users join or leave the chat.
- **Intuitive GUI** — PyQt6-based interface with colored messages and multiple views (connect, login, register, chat).
- **Session Management** — Server tracks users and enforces session validity.
- **Simple CLI server management** — Launch the server and configure host and port from the terminal.

## Directory Structure

```
ChatApp/
├── Client/
│   ├── Client.py         # Client networking, authentication, messaging
│   ├── UserList.py       # User tracking and updates in the GUI
│   ├── mainWindow.py     # Main PyQt6 GUI application
│   └── __init__.py
├── Server/
│   ├── Server.py         # Core server logic: socket handling, session/user management
│   ├── Authenticate.py   # Authentication handling
│   ├── Database.py       # SQLite-based persistence for users/sessions
│   ├── Logout.py         # Logout/session cleanup
│   ├── Messages.py       # Incoming/outgoing message processing
│   ├── Register.py       # Registration handler
│   └── __init__.py
├── Icons/                # Chat application icons (used in GUI)
├── requirements.txt
├── serve.py              # Entry point to start the server
└── README.md
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Raysh454/ChatApp.git
cd ChatApp
```

### 2. Install Dependencies

Ensure you have Python 3.9+.
```bash
pip install -r requirements.txt
```

### 3. Run the Server

```bash
python serve.py --host 0.0.0.0 --port 9999
```
- `--host` and `--port` are optional; defaults are shown above.

### 4. Run the Client

In another terminal or on a different machine:
```bash
cd Client
python mainWindow.py
```
Connect to the server using its IP and port.

## Usage

- **First time?** Use the “Register” button on the client to create a new account.
- **Messaging**: After login, type messages and press Enter or click Send to broadcast.
- **User List**: The GUI updates in real time as users join/leave.

## Architecture

- **Communication**: TCP sockets; messages serialized with JSON.
- **Persistence**: User data and sessions stored in a local SQLite database on the server.
- **Threading**: Server spawns a new thread per client connection.

## Requirements

- Python 3.9 or later
- PyQt6
- sqlite3 (included in standard Python)

Install all requirements using:
```bash
pip install -r requirements.txt
```

## Customization

- **Icons**: Place custom icons in the `Icons/` folder; update `mainWindow.py` if you want to use your own.
- **Server Settings**: Modify `serve.py` or provide different `--host`/`--port` arguments.

## Contributing

Pull requests are welcome! Please open an issue first to discuss your proposed changes.
