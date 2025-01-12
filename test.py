from pydub import AudioSegment

audio = AudioSegment.silent(duration=1000)  # 1 second of silence
audio.export("test_output.mp3", format="mp3")
print("Test file created: test_output.mp3")
