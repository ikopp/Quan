from pydub import AudioSegment
import os

def text_to_speech(input_text, sound_library_path, output_file):
    """
    Combines audio files based on input text into a single audio file.

    Args:
        input_text (str): The input text (e.g., "ABC").
        sound_library_path (str): Path to the folder containing sound files (e.g., "A.mp3").
        output_file (str): The name of the output audio file (e.g., "output.mp3").
    """
    combined_audio = AudioSegment.silent(duration=0)  # Start with an empty audio segment
    
    for char in input_text:
        char = char.upper()  # Normalize to uppercase to match file names like "A.mp3"
        audio_file = os.path.join(sound_library_path, f"{char}.mp3")
        
        if os.path.exists(audio_file):
            audio_segment = AudioSegment.from_file(audio_file)
            combined_audio += audio_segment
        else:
            print(f"Warning: Audio file for '{char}' not found. Skipping.")

    combined_audio.export(output_file, format="mp3")
    print(f"Output file created: {output_file}")

# Example usage
if __name__ == "__main__":
    input_text = input("Enter the text (e.g., 'ABC'): ")
    sound_library_path = "path/to/your/sound/library"  # Replace with the actual path
    output_file = "output.mp3"
    
    text_to_speech(input_text, sound_library_path, output_file)
