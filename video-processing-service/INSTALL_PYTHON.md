# How to Install Python on Windows

## The Problem

You're seeing this error because Windows has a "python" command that redirects to the Microsoft Store, but Python itself is not actually installed.

## Solution: Install Python

### Option 1: Install from Python.org (Recommended)

1. **Download Python**:
   - Go to: https://www.python.org/downloads/
   - Click the big yellow "Download Python" button
   - This will download the latest Python 3.x installer

2. **Run the Installer**:
   - Double-click the downloaded `.exe` file
   - **IMPORTANT**: Check the box "Add Python to PATH" at the bottom
   - Click "Install Now"
   - Wait for installation to complete

3. **Verify Installation**:
   - Close and reopen PowerShell
   - Run: `python --version`
   - You should see: `Python 3.x.x`

4. **Run Setup Again**:
   ```powershell
   cd D:\Echoplex\video-processing-service
   .\setup.ps1
   ```

### Option 2: Install from Microsoft Store

1. **Open Microsoft Store**:
   - Press `Windows Key` and type "Microsoft Store"
   - Open the Microsoft Store app

2. **Search for Python**:
   - Search for "Python 3.11" or "Python 3.12"
   - Click on the official Python app (by Python Software Foundation)

3. **Install**:
   - Click "Install" or "Get"
   - Wait for installation to complete

4. **Verify Installation**:
   - Close and reopen PowerShell
   - Run: `python --version`
   - You should see: `Python 3.x.x`

5. **Run Setup Again**:
   ```powershell
   cd D:\Echoplex\video-processing-service
   .\setup.ps1
   ```

## Troubleshooting

### "Python is not recognized" after installation

1. **Check if Python is installed**:
   - Open File Explorer
   - Navigate to: `C:\Users\YourUsername\AppData\Local\Programs\Python\`
   - If you see a Python folder, it's installed

2. **Add Python to PATH manually**:
   - Press `Windows Key` and search "Environment Variables"
   - Click "Edit the system environment variables"
   - Click "Environment Variables" button
   - Under "User variables", find "Path" and click "Edit"
   - Click "New" and add:
     - `C:\Users\YourUsername\AppData\Local\Programs\Python\Python3xx\`
     - `C:\Users\YourUsername\AppData\Local\Programs\Python\Python3xx\Scripts\`
   - Replace `3xx` with your Python version (e.g., `311` for Python 3.11)
   - Click OK on all dialogs
   - **Close and reopen PowerShell**

### Still having issues?

1. **Try using `py` launcher**:
   ```powershell
   py --version
   ```
   If this works, you can use `py` instead of `python` in commands.

2. **Check Python installation location**:
   ```powershell
   where.exe python
   ```
   This shows where Windows is looking for Python.

3. **Reinstall Python**:
   - Uninstall Python from Settings > Apps
   - Download fresh installer from python.org
   - Make sure to check "Add Python to PATH" during installation

## Quick Test

After installing Python, test it:

```powershell
python --version
python -m pip --version
```

Both commands should work without errors.

## Next Steps

Once Python is installed and working:

1. Navigate to the project:
   ```powershell
   cd D:\Echoplex\video-processing-service
   ```

2. Run the setup script:
   ```powershell
   .\setup.ps1
   ```

3. After setup completes, start the service:
   ```powershell
   .\start.ps1
   ```

