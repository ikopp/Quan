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
        // Split the input into chunks of 1000 characters
        const chunks = arabicInput.match(/.{1,1000}/g);

        // Prepare intermediate files list
        const intermediateFiles = [];

        // Process each chunk and concatenate audio files for it
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const intermediateFileName = `intermediate_${i + 1}.mp3`;
            const intermediateFilePath = path.resolve(`./${intermediateFileName}`);

            // Collect audio files for the chunk
            const audioFiles = [];
            for (const char of chunk) {
                const filePath = path.join(audioLibraryPath, `${char}.mp3`);
                if (fs.existsSync(filePath)) {
                    audioFiles.push(filePath);
                } else {
                    console.warn(`Audio file not found for character: ${char}`);
                }
            }

            // Ensure there are valid files for this chunk
            if (audioFiles.length === 0) {
                console.warn(`No valid audio files found for chunk ${i + 1}`);
                continue;
            }

            // Concatenate the chunk's audio files
            await new Promise((resolve, reject) => {
                audioconcat(audioFiles)
                    .concat(intermediateFilePath)
                    .on('start', command => console.log(`Processing chunk ${i + 1}: ${command}`))
                    .on('error', (error, stdout, stderr) => {
                        console.error(`Error during chunk ${i + 1} processing:`, error);
                        reject(error);
                    })
                    .on('end', output => {
                        console.log(`Intermediate file created: ${output}`);
                        intermediateFiles.push(intermediateFilePath);
                        resolve();
                    });
            });
        }

        // Ensure we have intermediate files to concatenate
        if (intermediateFiles.length === 0) {
            return res.status(404).json({ error: 'No valid audio files found to concatenate.' });
        }

        // Concatenate all intermediate files into the final output
        audioconcat(intermediateFiles)
            .concat(outputFilePath)
            .on('start', command => console.log(`Final concatenation process started: ${command}`))
            .on('error', (error, stdout, stderr) => {
                console.error('Error during final concatenation:', error);
                res.status(500).json({ error: 'Failed to generate final audio.' });
            })
            .on('end', output => {
                console.log('Final audio created successfully:', output);

                // Clean up intermediate files
                for (const file of intermediateFiles) {
                    fs.unlinkSync(file);
                }

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
