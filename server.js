const express = require('express');
const path = require('path');
const fs = require('fs');
const audioconcat = require('audioconcat');

const app = express();
app.use(express.json());

// Serve static files (CSS, JS, audio files)
app.use(express.static('public'));

// Serve the HTML file at the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Combine MP3 files without FFmpeg
app.post('/combine-audio', async (req, res) => {
    const { arabicInput } = req.body;
    if (!arabicInput) {
        return res.status(400).json({ error: 'No input provided' });
    }

    const audioLibraryPath = path.resolve('./Audio');
    const outputFilePath = path.resolve('./output.mp3');

    // Generate list of audio files
    const inputFiles = [...arabicInput]
        .map(char => path.join(audioLibraryPath, `${char}.mp3`))
        .filter(filePath => fs.existsSync(filePath));

    if (inputFiles.length === 0) {
        return res.status(404).json({ error: 'No matching audio files found.' });
    }

    // Combine audio files
    try {
        audioconcat(inputFiles)
            .concat(outputFilePath)
            .on('start', command => {
                console.log('Audio concatenation started:', command);
            })
            .on('end', () => {
                console.log('Audio concatenation finished');
                res.json({ success: true, output: '/output.mp3' });
            })
            .on('error', err => {
                console.error('Error combining audio:', err);
                res.status(500).json({ error: 'Failed to combine audio files.' });
            });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Unexpected error occurred.' });
    }
});

// Serve the combined audio file
app.get('/output.mp3', (req, res) => {
    const outputFilePath = path.resolve('./output.mp3');
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