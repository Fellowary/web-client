# Fellowary: Private, Secure, User Controlled Spaces

This is the front end code for Fellowary.  You can build the client with the following commands:
Requirements: this project requires Node@^14, yarn and openssl.  I've tested development on Linux and Mac but not Windows.

### Steps to run:
You'll have to install openssl on your own.  Check out brew on Mac or your package manager on Linux.

If that's done and you use nvm you can do:

### `nvm use 14`

Install everything js related:

### `yarn install`

Ensure that your browser sees localhost as `fellowary.local`.  This may require being super user.  I don't know what you do on windows.

### `echo '127.0.0.1 fellowary.local' >> /etc/hosts`

Create the self signed root cert and site cert and key for fellowary.local.  You may need to `chmod +x` the scripts.  The `.env` will look for the site cert and site key so modify that config file if you want to name them something else.

### `./createRootCA.sh`
then
### `./createSelfSignedCertificate.sh`

Add your testing root Certificate Authority to your browser of choice.  Again, I don't know what you do on windows.  Secure websockets and webworkers requires this step. It can't be skipped.

For Mac, this needs to be run as sudo:
### `./addRootToKeychain.sh`
To remove it just use, which also needs to be run as sudo:
### `./removeRootFromKeychain.sh`

Linux requires you to add the rootCA.pem directly to the browser and not the OS Keychain.  To do that go into your settings using the urls below.  Because you're adding the root Certificate you must import your generated `rootCA.pem` or `rootCA.crt` into the *Authorities* tab of your chosen browser.  

For Chrome go here `chrome://settings/certificates`

For Firefox go here `about:preferences` then search for "certificates":

Now that you've done all of the above let's start it up.  Hopefully this wasn't too difficult. This is just a Create React App 'n redux saga with some stuff added so if you've worked with it before you should find things pretty comfy.
### `yarn start`

Your browser tab should pop open and a user account should be automatically generated so you can play around.  There is no connect to a server so no network messages will be sent but feel free to poke around the code.  If your browser doesn't automatically open then go to https://fellowary.local:3000

In order to get the code that would be running live in user's browsers just change to the newest release branch and run deploy:
### `yarn deploy`
everything will be put into the `deploy/` directory where you can inspect everything.  The hashes in index.html should match what you see live.  If they don't let me know.

## Further Reading
If you want to learn more about how the code is architected and what the apis look like check out the Docs or dive into the code itself.
[Documentation](https://fellowary.com/docs)

## Code of Conduct:
`(Try to improve the project && (Be kind || Be respectful))`