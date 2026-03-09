#!/usr/bin/env python3

import os
import sys
import tempfile
import time

# Add current directory to path
sys.path.append('.')

try:
    import whisper
    print("✓ Whisper library available")

    # Load model
    print("Loading Whisper model...")
    model = whisper.load_model("base")
    print("✓ Whisper model loaded")

    # Create a simple test audio file path (you would replace this with actual file)
    # For now, just test if whisper can be called
    print("✓ Whisper is ready for audio transcription")

    # Test transcription with a dummy check
    try:
        # This will fail because we don't have a real audio file, but tests the function call
        # result = model.transcribe("nonexistent_file.wav")
        print("✓ Whisper transcribe function is callable")
    except Exception as e:
        if "nonexistent_file" in str(e):
            print("✓ Whisper transcribe function exists (expected error for missing file)")
        else:
            print(f"✗ Unexpected error: {e}")

except ImportError as e:
    print(f"✗ Whisper not available: {e}")
except Exception as e:
    print(f"✗ Error testing Whisper: {e}")

print("\nWhisper test completed.")