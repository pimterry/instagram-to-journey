const path = require('path');
const { promises: fs, createWriteStream } = require('fs');
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

function saveMediaResponse(itemId, id, url, format) {
    const extension = format === 'VIDEO' ? 'mp4' : 'jpg';
    const filename = `${itemId}-${id}.${extension}`;

    return fetch(url).then((response) =>
        new Promise((resolve, reject) => {
            const mediaFile = createWriteStream(path.join(OUTPUT_PATH, filename));
            response.body.pipe(mediaFile);
            mediaFile.on('finish', resolve);
            response.body.on('error', reject);
        })
    ).then(() => filename)
    // Blindly retry if anything fails, after 1s delay
    .catch(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(`Retrying ${url}`);
        return saveMediaResponse(itemId, id, url, format);
    });
}

async function saveItem(igItem) {
    const postedTime = new Date(igItem.timestamp).valueOf();
    const id = `${postedTime}-item`;

    const mediaDownloads = Promise.all(
        igItem.children
        ? igItem.children.data.map((child) =>
            saveMediaResponse(id, child.id, child.media_url, child.media_type)
        )
        : [saveMediaResponse(id, igItem.id, igItem.media_url, igItem.media_type)]
    );

    const caption = igItem.caption || '';

    return fs.writeFile(path.join(OUTPUT_PATH, `${id}.json`), JSON.stringify({
        id,
        date_modified: Date.now(),
        date_journal: postedTime,
        text: caption,
        preview_text: caption,
        photos: await mediaDownloads,
        tags: caption.match(/#[\w\d\-\.!\p{L}]+/gu) || [],
        type: "text"
    }), 'utf8');
}

const OUTPUT_PATH = path.join(__dirname, 'output');

getAllMedia().then((media) => {
    console.log(`Loaded ${media.length} results`);
    return fs.mkdir(OUTPUT_PATH).catch(() => {}).then(() => {
        return Promise.all(media.map(saveItem));

        // TODO: Zip up the output directory & delete it
    });
}).catch(console.error);