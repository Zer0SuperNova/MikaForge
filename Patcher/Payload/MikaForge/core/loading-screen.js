(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.__mikaForgeLoadingScreen) {
        return;
    }
    window.__mikaForgeLoadingScreen = true;
    
    // Text patterns to replace (case-insensitive)
    const textPatterns = [
        /forging\s+your\s+library/gi,
        /forging\s+library/gi,
        /forging/gi
    ];
    
    const replacementText = 'Initializing MikaForge';
    
    // Get the image path
    function getImagePath() {
        // Try multiple methods to get the path
        let appData = null;
        
        // Method 1: Check if exposed via window
        if (window.__mikaForgeAppData) {
            appData = window.__mikaForgeAppData;
        }
        // Method 2: Try process.env (if available in renderer)
        else if (typeof process !== 'undefined' && process.env && process.env.APPDATA) {
            appData = process.env.APPDATA;
        }
        // Method 3: Try to use IPC if available
        else if (window.__mikaForgeIpcRenderer) {
            try {
                appData = window.__mikaForgeIpcRenderer.sendSync('get-appdata-path');
            } catch (e) {
                // IPC not available or failed
            }
        }
        
        if (appData) {
            // Construct path and convert to file:// URL format
            const imagePath = appData.replace(/\\/g, '/') + '/MikaForge/core/images/MikaSplash.png';
            return 'file:///' + imagePath;
        }
        
        return null;
    }
    
    // Function to add splash image to loading screen
    function addSplashImage() {
        // Try to find common loading screen containers
        const possibleContainers = [
            document.querySelector('[class*="loading"]'),
            document.querySelector('[class*="splash"]'),
            document.querySelector('[class*="loader"]'),
            document.querySelector('[id*="loading"]'),
            document.querySelector('[id*="splash"]'),
            document.body
        ];
        
        let container = null;
        for (const candidate of possibleContainers) {
            if (candidate) {
                container = candidate;
                break;
            }
        }
        
        if (!container) return;
        
        // Check if image already added
        if (container.querySelector('#__mikaForge_splash_image')) {
            return;
        }
        
        const imagePath = getImagePath();
        if (!imagePath) {
            // Try alternative method - use relative path or data URL
            console.warn('[MikaForge] Could not determine image path, splash image not loaded');
            return;
        }
        
        // Create image element
        const splashImg = document.createElement('img');
        splashImg.id = '__mikaForge_splash_image';
        splashImg.src = imagePath;
        splashImg.alt = 'MikaForge';
        splashImg.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            max-width: 80vw;
            max-height: 80vh;
            width: auto;
            height: auto;
            z-index: 999998;
            pointer-events: none;
            opacity: 0.5;
            filter: brightness(0.6);
            object-fit: contain;
        `;
        
        // Insert the image
        if (container === document.body) {
            document.body.appendChild(splashImg);
        } else {
            // Try to insert as background or overlay
            container.style.position = 'relative';
            container.appendChild(splashImg);
        }
        
        // Handle image load errors
        splashImg.onerror = () => {
            console.warn('[MikaForge] Splash image not found at:', imagePath);
            splashImg.remove();
        };
    }
    
    // Function to replace text in a text node
    function replaceTextInNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.textContent;
            let replaced = false;
            
            // First, check if text already contains "Initializing MikaForge" with dots and clean it
            if (/Initializing\s+MikaForge\s*[\.…]+/i.test(text)) {
                text = text.replace(/Initializing\s+MikaForge\s*[\.…]+/gi, replacementText);
                replaced = true;
            }
            
            // Then check for the original patterns
            for (const pattern of textPatterns) {
                if (pattern.test(text)) {
                    text = text.replace(pattern, replacementText);
                    // Remove trailing dots, ellipsis (…), and spaces after replacement
                    text = text.replace(/\s*[\.…]{1,}\s*$/g, '');
                    replaced = true;
                    
                    // When we find the loading text, try to add the splash image
                    if (replaced) {
                        setTimeout(addSplashImage, 100);
                    }
                }
            }
            
            if (replaced) {
                node.textContent = text;
            }
        }
    }
    
    // Function to recursively search and replace text in all nodes
    function replaceTextInTree(root) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(replaceTextInNode);
    }
    
    // Initial replacement on existing content
    function initialReplace() {
        replaceTextInTree(document.body);
        // Also try to add splash image initially
        setTimeout(addSplashImage, 200);
    }
    
    // Watch for new content being added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        replaceTextInTree(node);
                    } else if (node.nodeType === Node.TEXT_NODE) {
                        replaceTextInNode(node);
                    }
                });
            } else if (mutation.type === 'characterData') {
                replaceTextInNode(mutation.target);
            }
        });
    });
    
    // Start observing when DOM is ready
    function startObserving() {
        if (document.body) {
            initialReplace();
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        } else {
            // Wait for body to be available
            setTimeout(startObserving, 100);
        }
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }
})();

