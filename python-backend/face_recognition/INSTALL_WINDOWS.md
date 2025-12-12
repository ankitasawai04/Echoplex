# Windows Installation Guide for Face Recognition Service

## Prerequisites

The `dlib` library (required by `face-recognition`) needs CMake to build from source on Windows.

### Option 1: Install CMake (Recommended)

1. Download CMake from: https://cmake.org/download/
2. Choose "Windows x64 Installer"
3. **IMPORTANT**: During installation, check "Add CMake to system PATH"
4. Restart your terminal/PowerShell after installation
5. Verify installation:
   ```powershell
   cmake --version
   ```

### Option 2: Use Pre-built Wheel (Easier)

Try installing a pre-built wheel first:

```powershell
pip install dlib-bin
```

If that doesn't work, proceed with Option 1.

### Option 3: Use Conda (Alternative)

If you have Anaconda/Miniconda:

```powershell
conda install -c conda-forge dlib
pip install face-recognition
```

## Installation Steps

1. **Navigate to the directory:**
   ```powershell
   cd D:\Echoplex\python-backend\face_recognition
   ```

2. **Create virtual environment:**
   ```powershell
   python -m venv venv
   ```

3. **Activate virtual environment:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

4. **Install CMake** (if not already installed - see Option 1 above)

5. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

   If dlib installation fails:
   - Make sure CMake is installed and in PATH
   - Restart PowerShell after installing CMake
   - Try: `pip install dlib-bin` first

6. **Start the service:**
   ```powershell
   python main.py
   ```

## Troubleshooting

### "CMake is not installed"
- Install CMake from https://cmake.org/download/
- Make sure to add CMake to PATH during installation
- Restart PowerShell after installation

### "dlib build failed"
- Ensure Visual C++ Build Tools are installed
- Download from: https://visualstudio.microsoft.com/downloads/
- Install "Desktop development with C++" workload
- Restart PowerShell

### Alternative: Use Docker
If installation continues to be problematic, consider using Docker:

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y cmake build-essential
COPY requirements.txt .
RUN pip install -r requirements.txt
```

## Quick Test

After installation, test if face-recognition works:

```powershell
python -c "import face_recognition; print('Success!')"
```

If this works, you're ready to start the service!


