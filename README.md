# instagram-to-journey

Quick node.js script to pull all posts from instagram and transform them to import to Journey.

You probably don't want to use this directly, but it might be helpful to crib from.

To use as-is:

* Clone this repo
* Run `npm install` (install node first, if you don't have it already)
* Set the `IG_ACCESS_TOKEN` env var as a valid Instagram access token for the basic API for your user. To get one:
    * Register an FB developer platform app
    * Add Instagram as a target platform
    * Configure your redirect URL to some valid value (e.g. `https://localhost:4321/auth`)
    * Add your target user as an 'Instagram tester'
    * Accept testing as your user (Edit Profile on the web -> Apps & Websites -> Tester Invites)
    * Open `https://api.instagram.com/oauth/authorize?app_id=$YOUR_IG_APP_ID&redirect_uri=$YOUR_REDIRECT_URL&scope=user_profile,user_media&response_type=code`
        * Here and below: note that there's a separate instagram app id/secret and whole-app app id/secret. You want to former.
    * Log into to instagram, allow your app to access your account
    * Pull the 'code' parameter from the resulting redirect
    * Run:
    ```
    curl -X POST \
    https://api.instagram.com/oauth/access_token \
    -F app_id=$YOUR_IG_APP_ID \
    -F app_secret=$YOUR_IG_APP_SECRET \
    -F grant_type=authorization_code \
    -F redirect_uri=https://localhost:4321/auth \
    -F code=$CODE_FROM_PREVIOUS_STEP
    ```
    * This will give you a 1h access token you can use
    * If you want a longer-lived token, run:
    ```
    curl 'https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=$YOUR_IG_APP_SECRET&access_token=$SHORT_LIVED_ACCESS_TOKEN'
    ```
* Run `node index.js`
* This will create an output directory
* Rename the directory to `journey-export` and zip it
    * Tested with the standard mac 'Compress "X"' menu optino.
    * We should be able to automate this, but doing so naively with [archiver](https://www.npmjs.com/package/archiver) doesn't work for some reason, seems to be some differences in the exact zip format.
* In the desktop Journey app, go to Preferences -> Database -> Import, and import the zip.
* All content, videos & photos will appear in Journey. Import can take a few minutes, syncing it may take much longer.
