# Simple New Tab Page

A simple new tab page replacement for Google Chrome.

<img width="1796" alt="Screen Shot 2022-02-11 at 02 42 03" src="https://user-images.githubusercontent.com/234804/153578353-e9323848-0a05-45e5-ad1c-6e0952720c6e.png">
<img width="1796" alt="Screen Shot 2022-02-11 at 02 41 34" src="https://user-images.githubusercontent.com/234804/153578376-2d30fdca-d14d-44fd-be17-1468bf27df4c.png">
<img width="1796" alt="Screen Shot 2022-02-11 at 02 41 11" src="https://user-images.githubusercontent.com/234804/153578381-c16dceaa-47cb-4ce7-a7ab-26702e4b9b19.png">

You can install it [from the chrome store](https://chrome.google.com/webstore/detail/simple-new-tab-page/bcolmammcoaoobfefeidagdbijgidgla)
or see below how to install manually.

This is a modified fork of https://github.com/kaissaroj/chrome-newtab

## Changes

* commented out the video (it's pretty but too distracting for me)
* build elements instead of using innerHTML
* use CSS instead of inline styling
* use `async`/`await` instead of `then`
* use const instead of var/let
* removed unused permissions
* switched to manifest version 3
* changed the font to just sans-serif. The thin font is pretty but my eyes can't focus on it
* darkened and thickened the drop shadow. Same as previous, too hard for my eyes

### Considering

- [X] remove the time?

  I'm not sure what the point of having the time/date/battery in the middle is.
  The time/date/battery is shown on both windows(bottom right) and mac(top right)
  at all times so not much point in having it on the new-tab-page. On the other 
  hand it feels more "designed" with something there than just the photo.
  If you have ideas what to replace it with. MOTD?
  
- [X]  Remove other devices?

- [X]  Add prefs

  Then you could turn on/off the video and maybe set some other things
  like font or position, choose what to show

- [X]  Cache pictures

  ~As it is I often get a blank blue tab for a few moments. I could possible
  download one picture in advance so you get it immediately and then download
  a new one for next time.~
  
- [X] Internationalize the date display

  ~Right now it's English only.~

## Usage

You can install it [from the chrome store](https://chrome.google.com/webstore/detail/simple-new-tab-page/bcolmammcoaoobfefeidagdbijgidgla) or install manually:

### Process to install in Google Chrome as extension: 

* Open Terminal/Command Prompt
* `git clone https://github.com/greggman/simple-new-tab-page.git`
   OR [download the zip](https://github.com/greggman/simple-new-tab-page/archive/refs/heads/main.zip) and unzip it.
* Copy this link  `chrome://extensions/` and paste in Chrome
* Enable Developer Mode and click `Load unpacked extension` button and select the extension folder.
