import fs from 'fs';
const content = fs.readFileSync('station-v121.html', 'utf8');

// Match text content between tags, very broadly
const textMatch = content.match(/>([^<]*?initial[^<]*?)</gi);
if (textMatch) {
    console.log("Found text matches in HTML:");
    console.log(textMatch);
} else {
    console.log("No text containing 'initial' found between HTML tags.");
}
