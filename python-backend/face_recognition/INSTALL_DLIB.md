# Installing dlib on Windows

The `dlib` library is required for the `face-recognition` package, but it requires CMake and Visual C++ Build Tools to compile on Windows.

## Option 1: Install CMake and Visual C++ Build Tools (Recommended)

1. **Install CMake:**
   - Download from: https://cmake.org/download/
   - During installation, select "Add CMake to system PATH"
   - Restart your terminal after installation

2. **Install Visual C++ Build Tools:**
   - Download "Build Tools for Visual Studio" from: https://visualstudio.microsoft.com/downloads/
   - Select "C++ build tools" workload during installation
   - This includes the C++ compiler needed to build dlib

3. **Install dlib:**
   ```powershell
   pip install dlib
   pip install face-recognition
   ```

## Option 2: Use Conda (Easier, but requires Conda)

If you have Anaconda or Miniconda installed:

```powershell
conda install -c conda-forge dlib
pip install face-recognition
```

## Option 3: Use Pre-built Wheel (If Available)

Sometimes pre-built wheels are available for specific Python versions:

```powershell
# Try finding a pre-built wheel
pip install --only-binary :all: dlib
pip install face-recognition
```

## Option 4: Use OpenCV Face Detection (Temporary Workaround)

The service can work with OpenCV's face detection (less accurate but no dlib needed). See `face_service_opencv.py` for an alternative implementation.

## Verify Installation

After installing, test it:

```python
python -c "import dlib; import face_recognition; print('Success!')"
```

If this works, you can start the service normally.

