document.addEventListener('DOMContentLoaded', () => {
    const piano = document.getElementById('piano');
    const specialKeys = [10, 14, 17, 20]; // Array of keys to be colored specially

    // Function to create a key
    function createKey(color, index) {
        const key = document.createElement('div');
        key.classList.add('key', color);
        if (specialKeys.includes(index)) {
            key.classList.add('chordkey');
        }
    
        // Add an event listener to the key
        key.addEventListener('click', () => {
            // Remove the 'active' class from the previously active key, if there is one
            const activeKey = document.querySelector('.chordkey.active');
            if (activeKey) {
                activeKey.classList.remove('active');
            }
    
            // Remove existing controls, if there are any
            const existingControls = document.querySelector('.controls');
            if (existingControls) {
                existingControls.remove();
            }
    
            // Add the 'active' class to the clicked key
            key.classList.add('active');
    
            // Create and add the controls
            if (specialKeys.includes(index)){
                const controls = createControls(index);
                document.body.appendChild(controls);
            }
    
            console.log(`Key ${index} was clicked`);
        });
    
        return key;
    }
    
    function createControls(index) {
        const controls = document.createElement('div');
        controls.classList.add('controls');
    
        const xButton = document.createElement('button');
        xButton.textContent = 'x';
        xButton.classList.add('x-button');
        xButton.addEventListener('click', () => {
            console.log(`X button for key ${index} was clicked`);
        });

        function handleArrowClick(index, direction) {
            console.log(`Arrow for key ${index} was clicked`);
            const specialKeyIndex = specialKeys.indexOf(index);
            if (specialKeyIndex !== -1) {
                specialKeys[specialKeyIndex] += 12 * direction;
        
                // change state of old and new keys
                const key = document.querySelector(`.key:nth-child(${index})`);
                const newKey = document.querySelector(`.key:nth-child(${index + 12 * direction})`);
                key.classList.remove('chordkey');
                key.classList.remove('active');
                newKey.classList.add('chordkey');
                newKey.classList.add('active');
        
                // update the controls position
                const keyRect = newKey.getBoundingClientRect();
                newKey.click();
            }
            console.log("New Notes Array: " + specialKeys);

        }
        
        const leftArrow = document.createElement('button');
        leftArrow.textContent = '<';
        leftArrow.classList.add('leftarrow');
        leftArrow.addEventListener('click', () => handleArrowClick(index, -1));
        
        const rightArrow = document.createElement('button');
        rightArrow.textContent = '>';
        rightArrow.classList.add('rightarrow');
        rightArrow.addEventListener('click', () => handleArrowClick(index, 1));
    
        controls.appendChild(leftArrow);
        controls.appendChild(xButton);
        controls.appendChild(rightArrow);
    
        // Position the controls under the key
        const key = document.querySelector(`.key:nth-child(${index + 1})`);
        const keyRect = key.getBoundingClientRect();
        controls.style.position = 'absolute';
        controls.style.left = `${keyRect.left}px`;
        controls.style.top = `${keyRect.bottom}px`;
    
        return controls;
    }
    
    // Add keys to the piano
    for (let i = 1; i <= 36; i++) {
        let keyColor = 'white';
        if ([2, 4, 7, 9, 11, 14, 16, 19, 21, 23, 26, 28, 31, 33, 35].includes(i)) {
            keyColor = 'black';
        }
        piano.appendChild(createKey(keyColor, i));
    }
});