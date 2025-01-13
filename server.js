const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const audioconcat = require('audioconcat');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.resolve('./')));

app.post('/synthesize', async (req, res) => {
    const { arabicInput, library } = req.body;

    if (!arabicInput || !library) {
        return res.status(400).json({ error: 'Arabic input and library must be provided.' });
    }

    // Resolve the appropriate library path
    const audioLibraryPath = path.resolve(`./${library}`);
    const outputFileName = library === 'Audio Aziz' ? 'outputA.mp3' : 'outputB.mp3';
    const outputFilePath = path.resolve(`./${outputFileName}`);

    try {
        // Initialize the list of audio files to concatenate
        const audioFiles = [];

        // Add each character's audio file to the list
        for (const char of arabicInput) {
            const filePath = path.join(audioLibraryPath, `${char}.mp3`);
            if (fs.existsSync(filePath)) {
                audioFiles.push(filePath);
            } else {
                console.warn(`Audio file not found for character: ${char}`);
            }
        }

        // Ensure we have at least one valid audio file
        if (audioFiles.length === 0) {
            return res.status(404).json({ error: 'No valid audio files found to concatenate.' });
        }

        // Use audioconcat to merge the files
        audioconcat(audioFiles)
            .concat(outputFilePath)
            .on('start', command => console.log(`ffmpeg process started: ${command}`))
            .on('error', (error, stdout, stderr) => {
                console.error('Error during audio concatenation:', error);
                res.status(500).json({ error: 'Failed to generate audio.' });
            })
            .on('end', output => {
                console.log('Audio created successfully:', output);
                res.json({ success: true, output: `/${outputFileName}` });
            });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Unexpected error occurred.' });
    }
});

// Serve the output files
app.get('/outputA.mp3', (req, res) => {
    const outputFilePath = path.resolve('./outputA.mp3');
    if (fs.existsSync(outputFilePath)) {
        res.sendFile(outputFilePath);
    } else {
        res.status(404).send('Audio file not found.');
    }
});

app.get('/outputB.mp3', (req, res) => {
    const outputFilePath = path.resolve('./outputB.mp3');
    if (fs.existsSync(outputFilePath)) {
        res.sendFile(outputFilePath);
    } else {
        res.status(404).send('Audio file not found.');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
