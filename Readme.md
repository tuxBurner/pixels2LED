# This is the software for my PngToLed Project

## Backend

 Written in nodejs

### Testing

curl -H "Authorization: cf97edf7-5ff9-4489-9ba0-8f89d4ee8144" -F imageData=@tux.png http://localhost:3000/image
curl -H "Authorization: cf97edf7-5ff9-4489-9ba0-8f89d4ee8144" http://localhost:3000/brightness/255
curl -H "Authorization: cf97edf7-5ff9-4489-9ba0-8f89d4ee8144" http://localhost:3000/emoji/:heart:
