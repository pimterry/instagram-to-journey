const path = require('path');
const fs = require('fs').promises;
const querystring = require('querystring');
const fetch = require('node-fetch');

const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;

async function getAllMedia(nextUrl) {
    const mediaUrl = nextUrl || `https://graph.instagram.com/me/media?${querystring.stringify({
        fields: "id,caption,media_type,media_url,timestamp,children{media_type,media_url,id}",
        access_token: ACCESS_TOKEN,
        limit: 10000
    })}`;

    const response = await fetch(mediaUrl);
    const result = await response.json();

    if (result.error) throw result.error;

    if (result.paging && result.paging.next) {
        const nextData = await getAllMedia(result.paging.next);
        return result.data.concat(nextData);
    } else {
        return result.data;
    }
}

const OUTPUT_PATH = path.join(__dirname, 'output');

getAllMedia().then((media) => {
    console.log(`Loaded ${media.length} results`);

    return fs.mkdir(OUTPUT_PATH);
}).then(() => {
    // TODO: What's the minimum JSON file for a successful import?

    // TODO:, For each post:
    // - Download all referenced URLs
    // - Create JSON linking to that URL
    // - Give it a UUID id & filename
    // - Parse the tags from the caption?
    // - Save the content & JSON to the output directory

    // TODO: Zip up the output directory & delete it
}).catch(console.error);