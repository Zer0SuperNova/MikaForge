(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.__mikaForgeConsole) {
        return;
    }
    window.__mikaForgeConsole = true;
    
    // Create console container
    const consoleContainer = document.createElement('div');
    consoleContainer.id = '__mikaForge_console';
    consoleContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        height: 400px;
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        z-index: 999999;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        pointer-events: none;
    `;
    
    // Create console header
    const consoleHeader = document.createElement('div');
    consoleHeader.style.cssText = `
        background: #2d2d2d;
        padding: 8px 12px;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        user-select: none;
    `;
    
    const consoleTitle = document.createElement('div');
    consoleTitle.textContent = 'MikaForge Console';
    consoleTitle.style.cssText = `
        color: #fff;
        font-weight: bold;
        font-size: 13px;
    `;
    
    const headerButtons = document.createElement('div');
    headerButtons.style.cssText = `
        display: flex;
        gap: 8px;
        align-items: center;
    `;
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.title = 'Clear console output';
    clearButton.style.cssText = `
        background: #3e3e42;
        border: none;
        color: #fff;
        font-size: 11px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    `;
    clearButton.onmouseover = () => clearButton.style.background = '#4e4e52';
    clearButton.onmouseout = () => clearButton.style.background = '#3e3e42';
    
    const copyAllButton = document.createElement('button');
    copyAllButton.textContent = 'Copy All';
    copyAllButton.title = 'Copy all console output';
    copyAllButton.style.cssText = `
        background: #3e3e42;
        border: none;
        color: #fff;
        font-size: 11px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    `;
    copyAllButton.onmouseover = () => copyAllButton.style.background = '#4e4e52';
    copyAllButton.onmouseout = () => copyAllButton.style.background = '#3e3e42';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 20px;
        border-radius: 3px;
    `;
    closeButton.onmouseover = () => closeButton.style.background = '#ff4444';
    closeButton.onmouseout = () => closeButton.style.background = 'transparent';
    
    headerButtons.appendChild(clearButton);
    headerButtons.appendChild(copyAllButton);
    headerButtons.appendChild(closeButton);
    
    consoleHeader.appendChild(consoleTitle);
    consoleHeader.appendChild(headerButtons);
    
    // Create console output area
    const consoleOutput = document.createElement('div');
    consoleOutput.id = '__mikaForge_console_output';
    consoleOutput.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        color: #d4d4d4;
        background: #1e1e1e;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.5;
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
    `;
    
    // Create console input area
    const consoleInputContainer = document.createElement('div');
    consoleInputContainer.style.cssText = `
        border-top: 1px solid #333;
        padding: 8px;
        background: #252526;
        display: flex;
        align-items: center;
    `;
    
    const consolePrompt = document.createElement('span');
    consolePrompt.textContent = '> ';
    consolePrompt.style.cssText = `
        color: #569cd6;
        margin-right: 8px;
        font-weight: bold;
    `;
    
    const consoleInput = document.createElement('input');
    consoleInput.type = 'text';
    consoleInput.id = '__mikaForge_console_input';
    consoleInput.style.cssText = `
        flex: 1;
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #d4d4d4;
        padding: 6px 8px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        outline: none;
        border-radius: 2px;
    `;
    consoleInput.onfocus = () => consoleInput.style.borderColor = '#007acc';
    consoleInput.onblur = () => consoleInput.style.borderColor = '#3e3e42';
    
    consoleInputContainer.appendChild(consolePrompt);
    consoleInputContainer.appendChild(consoleInput);
    
    // Assemble console
    consoleContainer.appendChild(consoleHeader);
    consoleContainer.appendChild(consoleOutput);
    consoleContainer.appendChild(consoleInputContainer);
    document.body.appendChild(consoleContainer);
    
    // Create toggle button in sidebar
    function addConsoleToSidebar() {
        // Check if console button already exists
        if (document.querySelector('.mika-console-menu-item')) {
            console.log('[MikaForge Console] Button already exists, skipping');
            return;
        }
        
        // Find the system-side-menu - this is where the settings button is
        const sidenav = document.querySelector('.sidenav');
        if (!sidenav) {
            console.warn('[MikaForge Console] Sidenav not found');
            return;
        }
        
        const systemSideMenu = sidenav.querySelector('.system-side-menu');
        if (!systemSideMenu) {
            console.warn('[MikaForge Console] system-side-menu not found in sidenav');
            return;
        }
        
        const userMenu = systemSideMenu.querySelector('.user-menu');
        if (!userMenu) {
            console.warn('[MikaForge Console] user-menu not found in system-side-menu');
            return;
        }
        
        console.log('[MikaForge Console] Found system-side-menu and user-menu');
        
        // Create menu item - matching the structure of other user-menu-item items
        const menuItem = document.createElement('li');
        menuItem.className = 'user-menu-item mika-console-menu-item';
        
        // Create link (matching the style of settings button exactly)
        const toggleButton = document.createElement('a');
        toggleButton.className = 'tab';
        toggleButton.href = '#';
        toggleButton.setAttribute('data-discover', 'true');
        toggleButton.setAttribute('draggable', 'false');
        toggleButton.title = 'MikaForge Console';
        // Don't add inline styles - let CSS handle everything
        
        // Create SVG icon - terminal/console icon (same size as settings icon)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.cssText = 'fill: currentColor;';
        
        // Terminal/console icon path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M20,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4M20,18H4V8H20V18M20,6H4V6H20M6,15H8V17H6V15M11,15H16V17H11V15Z');
        path.setAttribute('fill', 'currentColor');
        
        svg.appendChild(path);
        toggleButton.appendChild(svg);
        menuItem.appendChild(toggleButton);
        
        // Set click handler
        toggleButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleConsole();
        };
        
        // Insert right before the settings button
        // Find the settings link by its href attribute
        const settingsLink = userMenu.querySelector('a[href*="settings"]');
        if (settingsLink) {
            const settingsItem = settingsLink.closest('li');
            if (settingsItem) {
                console.log('[MikaForge Console] Found settings item:', settingsItem);
                // Insert right before the settings button
                try {
                    userMenu.insertBefore(menuItem, settingsItem);
                    console.log('[MikaForge Console] Inserted before settings button');
                } catch (e) {
                    // Fallback: append to end
                    console.warn('[MikaForge Console] Insert failed, appending:', e);
                    userMenu.appendChild(menuItem);
                }
            } else {
                // Fallback: find last li
                const lastItem = userMenu.querySelector('li:last-child');
                if (lastItem) {
                    userMenu.insertBefore(menuItem, lastItem);
                } else {
                    userMenu.appendChild(menuItem);
                }
            }
        } else {
            // Fallback: find last li
            const lastItem = userMenu.querySelector('li:last-child');
            if (lastItem) {
                userMenu.insertBefore(menuItem, lastItem);
            } else {
                userMenu.appendChild(menuItem);
            }
        }

        
        // Verify it was added
        const isInDOM = document.contains(menuItem);
        const parentCheck = menuItem.parentNode === userMenu;
        console.log('[MikaForge Console] Menu item created');
        console.log('[MikaForge Console] - In DOM:', isInDOM);
        console.log('[MikaForge Console] - Parent is user-menu:', parentCheck);
        
        if (!isInDOM || !parentCheck) {
            console.error('[MikaForge Console] ERROR: Menu item not properly inserted!');
        }
        
        // Expose function for manual testing
        window.__mikaForgeAddConsoleButton = addConsoleToSidebar;
    }
    
    // Watch for when the sidebar is created dynamically
    function waitForSidebar() {
        const systemSideMenu = document.querySelector('.system-side-menu');
        if (systemSideMenu) {
            // Check if button already exists
            if (document.querySelector('.mika-console-menu-item')) {
                return true; // Already added
            }
            
            // Check if the settings button exists (sidebar is ready)
            const userMenu = systemSideMenu.querySelector('.user-menu');
            const settingsItem = userMenu?.querySelector('li:last-child');
            if (settingsItem) {
                console.log('[MikaForge Console] System sidebar found with settings button! Adding console button...');
                addConsoleToSidebar();
                // Verify it was added
                const added = document.querySelector('.mika-console-menu-item');
                if (added) {
                    console.log('[MikaForge Console] Console button added successfully!', added);
                    return true; // Found and added
                } else {
                    console.warn('[MikaForge Console] Failed to add console button');
                }
            } else {
                // Sidebar exists but settings button not ready yet
                return false;
            }
        }
        return false; // Not found yet
    }
    
    // Use MutationObserver to watch for when sidebar is created
    const sidebarObserver = new MutationObserver((mutations) => {
        // Check if sidebar exists now and button hasn't been added
        if (!document.querySelector('.mika-console-menu-item')) {
            const systemSideMenu = document.querySelector('.system-side-menu');
            if (systemSideMenu) {
                // Check if settings button exists (sidebar is fully loaded)
                const userMenu = systemSideMenu.querySelector('.user-menu');
                const settingsItem = userMenu?.querySelector('li:last-child');
                if (settingsItem) {
                    console.log('[MikaForge Console] System sidebar detected via MutationObserver with settings button!');
                    waitForSidebar();
                }
            }
        }
    });
    
    // Start observing the document body for when sidebar is added
    if (document.body) {
        sidebarObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        // Wait for body to exist
        document.addEventListener('DOMContentLoaded', () => {
            sidebarObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
    
    // Also watch specifically for .system-side-menu to appear
    const systemSideMenuObserver = new MutationObserver(() => {
        const systemSideMenu = document.querySelector('.system-side-menu');
        if (systemSideMenu && !document.querySelector('.mika-console-menu-item')) {
            const userMenu = systemSideMenu.querySelector('.user-menu');
            if (userMenu) {
                console.log('[MikaForge Console] System-side-menu detected!');
                setTimeout(waitForSidebar, 100);
            }
        }
    });
    
    if (document.body) {
        systemSideMenuObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Also try immediately and with a retry mechanism
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max
    
    function tryAddConsole() {
        attempts++;
        if (waitForSidebar()) {
            // Success! Stop trying
            return;
        } else if (attempts < maxAttempts) {
            setTimeout(tryAddConsole, 100);
        } else {
            console.warn('[MikaForge Console] Max attempts reached. Sidebar may not be loading.');
        }
    }
    
    // Start trying immediately
    tryAddConsole();
    
    // Also try when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryAddConsole);
    }
    
    // Try after various delays to catch late-loading sidebars
    setTimeout(tryAddConsole, 500);
    setTimeout(tryAddConsole, 1000);
    setTimeout(tryAddConsole, 2000);
    setTimeout(tryAddConsole, 3000);
    setTimeout(tryAddConsole, 5000);
    
    // Also expose a manual trigger that can be called from browser console
    window.__mikaForgeTryAddConsole = tryAddConsole;
    
    // Console state
    let isOpen = false;
    let isFirstOpen = true; // Track if this is the first time opening
    let commandHistory = [];
    let historyIndex = -1;
    
    // Copy text to clipboard
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                // Show brief feedback
                const feedback = document.createElement('div');
                feedback.textContent = 'Copied!';
                feedback.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #007acc;
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 4px;
                    z-index: 1000000;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    font-size: 12px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                `;
                document.body.appendChild(feedback);
                setTimeout(() => feedback.style.opacity = '1', 10);
                setTimeout(() => {
                    feedback.style.opacity = '0';
                    setTimeout(() => feedback.remove(), 200);
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Failed to copy:', err);
            }
            document.body.removeChild(textArea);
        }
    }
    
    // Add log to console output
    function addLog(message, type = 'log') {
        const logContainer = document.createElement('div');
        logContainer.style.cssText = `
            margin-bottom: 4px;
            display: flex;
            align-items: flex-start;
            position: relative;
        `;
        
        const logEntry = document.createElement('div');
        logEntry.style.cssText = `
            flex: 1;
            word-wrap: break-word;
            white-space: pre-wrap;
            user-select: text;
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
        `;
        
        const colors = {
            log: '#d4d4d4',
            error: '#f48771',
            warn: '#cca700',
            info: '#569cd6',
            success: '#89d185',
            input: '#dcdcaa'
        };
        
        logEntry.style.color = colors[type] || colors.log;
        
        const logText = type === 'input' ? `> ${message}` : message;
        logEntry.textContent = logText;
        
        const copyButton = document.createElement('button');
        copyButton.textContent = '📋';
        copyButton.title = 'Copy this line';
        copyButton.style.cssText = `
            background: transparent;
            border: none;
            color: #888;
            font-size: 12px;
            cursor: pointer;
            padding: 2px 6px;
            margin-left: 8px;
            opacity: 0;
            transition: opacity 0.2s;
            flex-shrink: 0;
        `;
        copyButton.onmouseover = () => {
            copyButton.style.color = '#fff';
            copyButton.style.opacity = '1';
        };
        copyButton.onmouseout = () => {
            copyButton.style.color = '#888';
            copyButton.style.opacity = '0';
        };
        copyButton.onclick = (e) => {
            e.stopPropagation();
            copyToClipboard(logText);
        };
        
        logContainer.onmouseenter = () => copyButton.style.opacity = '0.5';
        logContainer.onmouseleave = () => copyButton.style.opacity = '0';
        
        logContainer.appendChild(logEntry);
        logContainer.appendChild(copyButton);
        
        consoleOutput.appendChild(logContainer);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
    
    // Execute command using script injection (works with CSP 'unsafe-inline')
    function executeCommand(command) {
        if (!command.trim()) return;
        
        addLog(command, 'input');
        commandHistory.push(command);
        historyIndex = commandHistory.length;
        
        try {
            // Use script injection which works with CSP 'unsafe-inline'
            const script = document.createElement('script');
            const scriptId = '__mikaForge_console_script_' + Date.now();
            const callbackId = '__mikaForge_console_callback_' + Date.now();
            
            // Create a callback function that can access addLog
            window[callbackId] = function(result, isError, errorMsg) {
                try {
                    if (isError) {
                        addLog(errorMsg || 'Error executing command', 'error');
                    } else {
                        if (result !== undefined) {
                            if (typeof result === 'object' && result !== null) {
                                try {
                                    addLog(JSON.stringify(result, null, 2), 'log');
                                } catch (e) {
                                    addLog(String(result), 'log');
                                }
                            } else {
                                addLog(String(result), 'log');
                            }
                        } else {
                            addLog('undefined', 'log');
                        }
                    }
                } catch (e) {
                    addLog('Command executed', 'log');
                }
                // Cleanup
                delete window[callbackId];
                if (script.parentNode) {
                    script.remove();
                }
            };
            
            // Wrap the command to capture result
            // Detect if it's an expression (needs return) or statement
            const trimmedCmd = command.trim();
            const isExpression = !trimmedCmd.endsWith(';') && 
                                 !trimmedCmd.includes('{') && 
                                 !trimmedCmd.toLowerCase().startsWith('return') &&
                                 !trimmedCmd.toLowerCase().startsWith('let ') &&
                                 !trimmedCmd.toLowerCase().startsWith('const ') &&
                                 !trimmedCmd.toLowerCase().startsWith('var ') &&
                                 !trimmedCmd.toLowerCase().startsWith('if ') &&
                                 !trimmedCmd.toLowerCase().startsWith('for ') &&
                                 !trimmedCmd.toLowerCase().startsWith('while ');
            
            // Use template literal carefully to avoid issues
            const escapedCommand = command.replace(/`/g, '\\`').replace(/\${/g, '\\${');
            const scriptContent = isExpression 
                ? `(function() {
                    try {
                        const result = ${escapedCommand};
                        if (typeof window['${callbackId}'] === 'function') {
                            window['${callbackId}'](result, false);
                        }
                    } catch (error) {
                        if (typeof window['${callbackId}'] === 'function') {
                            window['${callbackId}'](null, true, 'Error: ' + error.message);
                        }
                    }
                })();`
                : `(function() {
                    try {
                        ${escapedCommand}
                        if (typeof window['${callbackId}'] === 'function') {
                            window['${callbackId}'](undefined, false);
                        }
                    } catch (error) {
                        if (typeof window['${callbackId}'] === 'function') {
                            window['${callbackId}'](null, true, 'Error: ' + error.message);
                        }
                    }
                })();`;
            
            script.textContent = scriptContent;
            script.id = scriptId;
            
            // Inject and execute
            (document.head || document.documentElement).appendChild(script);
            
            // Fallback cleanup after 5 seconds
            setTimeout(() => {
                if (window[callbackId]) {
                    delete window[callbackId];
                }
                if (script.parentNode) {
                    script.remove();
                }
            }, 5000);
            
        } catch (error) {
            addLog(`Error: ${error.message}`, 'error');
        }
    }
    
    // Toggle console
    function toggleConsole() {
        isOpen = !isOpen;
        
        if (isOpen) {
            // Always center the console on screen when opening
            consoleContainer.style.left = '50%';
            consoleContainer.style.top = '50%';
            consoleContainer.style.transform = 'translate(-50%, -50%)';
            hasBeenDragged = false; // Reset so it centers next time too
            
            // Show console with fade-in animation
            consoleContainer.style.display = 'flex';
            consoleContainer.style.visibility = 'visible';
            consoleContainer.style.pointerEvents = 'auto';
            
            // Trigger fade-in after a tiny delay to ensure display is set
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    consoleContainer.style.opacity = '1';
                });
            });
            
            consoleInput.focus();
            
            // Only show initialization messages on first open
            if (isFirstOpen) {
                addLog('MikaForge Console initialized', 'info');
                addLog('Type JavaScript commands and press Enter to execute', 'info');
                isFirstOpen = false;
            }
        } else {
            // Fade out animation
            consoleContainer.style.opacity = '0';
            consoleContainer.style.pointerEvents = 'none';
            
            // Hide after animation completes
            setTimeout(() => {
                if (!isOpen) {
                    consoleContainer.style.visibility = 'hidden';
                    consoleContainer.style.display = 'none';
                }
            }, 300); // Match transition duration
        }
    }
    
    // Close console
    function closeConsole() {
        isOpen = false;
        
        // Fade out animation
        consoleContainer.style.opacity = '0';
        consoleContainer.style.pointerEvents = 'none';
        
        // Hide after animation completes
        setTimeout(() => {
            consoleContainer.style.visibility = 'hidden';
            consoleContainer.style.display = 'none';
        }, 300); // Match transition duration
    }
    
    // Clear console output
    function clearConsole() {
        consoleOutput.innerHTML = '';
    }
    
    // Copy all console output
    function copyAllOutput() {
        const allLogs = Array.from(consoleOutput.querySelectorAll('div > div:first-child')).map(el => el.textContent);
        const allText = allLogs.join('\n');
        copyToClipboard(allText);
    }
    
    // Event listeners
    closeButton.onclick = closeConsole;
    clearButton.onclick = clearConsole;
    copyAllButton.onclick = copyAllOutput;
    
    consoleInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = consoleInput.value;
            executeCommand(command);
            consoleInput.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                consoleInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                consoleInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                consoleInput.value = '';
            }
        }
    };
    
    // Make console draggable
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let hasBeenDragged = false; // Track if user has moved the console
    
    consoleHeader.onmousedown = (e) => {
        isDragging = true;
        const rect = consoleContainer.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        // Remove transform when dragging starts (if it was centered)
        if (!hasBeenDragged) {
            consoleContainer.style.transform = 'none';
            // Convert from centered position to absolute position
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            consoleContainer.style.left = (centerX - consoleContainer.offsetWidth / 2) + 'px';
            consoleContainer.style.top = (centerY - consoleContainer.offsetHeight / 2) + 'px';
        }
        e.preventDefault();
    };
    
    document.onmousemove = (e) => {
        if (isDragging) {
            hasBeenDragged = true;
            // Calculate position from top-left corner
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            consoleContainer.style.left = newX + 'px';
            consoleContainer.style.top = newY + 'px';
        }
    };
    
    /**
     * Stop dragging the console when the user releases the mouse button
     */
    document.onmouseup = () => {
        isDragging = false;
    };
    
    // Intercept console methods
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };
    
    /**
     * Overridden console.log function to log messages to our console
     * if it is open. The original console.log function is called first.
     * @param {...*} args - The arguments to be logged.
     */
    console.log = function(...args) {
        originalConsole.log.apply(console, args);
        if (isOpen) {
            addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'log');
        }
    };
    

    /**
     * Overridden console.error function to log errors to our console
     * if it is open. The original console.error function is called first.
     * @param {...*} args - The arguments to be logged.
     */
    console.error = function(...args) {
        originalConsole.error.apply(console, args);
        if (isOpen) {
            addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'error');
        }
    };
    

    /**
     * Logs a warning message to the console.
     * If the console is open, also logs the message to our console.
     * @param {...*} args - The arguments to be logged.
     */
    console.warn = function(...args) {
        originalConsole.warn.apply(console, args);
        if (isOpen) {
            addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'warn');
        }
    };
    
    /**
     * Info level logging for the console. This method is overridden
     * to also add the log to our console if it is open.
     * @param {...*} args - The arguments to be logged.
     */
    console.info = function(...args) {
        originalConsole.info.apply(console, args);
        if (isOpen) {
            addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'info');
        }
    };
})();

