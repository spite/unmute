# unmute
Provides UI to resume Audio Contexts and Audio elements suspended due to the new autoplay policy

# How to use (for now)

- Get the code (clone the repo or download the source)
- Go to chrome://extensions/
- Enable Developer Mode (top right corner)
- Click LOAD UNPACKED 
- Browse to the folder with the source
- A pause icon should appear next to the omnibar
- Go into the extension details and enable Allow in incognito

- Go to a page with Web Audio or HTML Audio
- If the elements are suspended, the pause button should change to a play button and show a number
- Click on the button to resume those contexts or audio elements
- Click on the button again to pause all of those contexts or audio elements
