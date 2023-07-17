``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```



/**
 * units, constants
 */
const boxUnit = 0.2;
const game = (() => {
    const dimensions = {
        height: 20,
        width: 10
    };
    const field = (() => {
        const array = new Int16Array(dimensions.height);
        for (let i = 0; i < 20; i++) {
            array[i] = new Int16Array(dimensions.width);
        }
    })();
    return { dimensions, field }
})();