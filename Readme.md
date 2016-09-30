# This is the software for my PngToLed Project

## Backend

 Written in nodejs

### Testing

```bash
# uploads an image tux.png
curl -H "Authorization: cf97edf7-5ff9-4489-9ba0-8f89d4ee8144" -F imageData=@tux.png http://localhost:3000/image
# sets the brightness to 255 can be in the range (0..255)
curl -H "Authorization: cf97edf7-5ff9-4489-9ba0-8f89d4ee8144" http://localhost:3000/brightness/255
# displays the emoji :heart:
curl -H "Authorization: cf97edf7-5ff9-4489-9ba0-8f89d4ee8144" http://localhost:3000/emoji/:heart:
# you can use the unicode to if you want to
curl -H "Authorization: cf97edf7-5ff9-4489-9ba0-8f89d4ee8144" --data 'value=💔' http://localhost:3000/emoj
```
