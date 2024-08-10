build:
    fd -e ts | entr -c -r bun build main.ts --outfile=content-script.js

tailwind:
    tailwindcss build --watch -i input.css -o style.css
