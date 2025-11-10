(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.__mikaForgeThemesMenu) {
        return;
    }
    window.__mikaForgeThemesMenu = true;
    
    // Theme management
    let currentThemeStyle = null;
    const THEME_STORAGE_KEY = '__mikaForge_selectedTheme';
    
    // Live CSS Editor
    let liveCssEditor = null;
    let liveCssStyle = null;
    const LIVE_CSS_STORAGE_KEY = '__mikaForge_liveCss';
    const LIVE_CSS_EDITOR_VISIBLE_KEY = '__mikaForge_liveCssEditorVisible';
    
    // Theme application functions (available globally)
    function getCurrentTheme() {
        return localStorage.getItem(THEME_STORAGE_KEY) || null;
    }
    
    function applyTheme(themeFile) {
        // Remove existing theme style
        if (currentThemeStyle) {
            currentThemeStyle.remove();
            currentThemeStyle = null;
        }
        
        // Load and apply new theme
        const themeFiles = window.__mikaForgeThemeFiles || [];
        if (themeFiles.includes(themeFile)) {
            const themeCode = window.__mikaForgeThemeData?.[themeFile];
            if (themeCode) {
                currentThemeStyle = document.createElement('style');
                currentThemeStyle.id = '__mikaForge_theme_style';
                currentThemeStyle.textContent = themeCode;
                document.head.appendChild(currentThemeStyle);
                
                // Save preference
                localStorage.setItem(THEME_STORAGE_KEY, themeFile);
                
                // Trigger theme change event for Plugin API
                if (window.MikaForge && window.MikaForge._triggerThemeChange) {
                    window.MikaForge._triggerThemeChange(themeFile);
                }
            }
        } else {
            // No theme selected, just clear
            localStorage.removeItem(THEME_STORAGE_KEY);
        }
    }
    
    function removeTheme() {
        // Remove existing theme style
        if (currentThemeStyle) {
            currentThemeStyle.remove();
            currentThemeStyle = null;
        }
        
        // Clear preference
        localStorage.removeItem(THEME_STORAGE_KEY);
    }
    
    // Function to load theme on page load (waits for theme data to be available)
    function loadThemeOnPageLoad() {
        const savedTheme = getCurrentTheme();
        if (!savedTheme) {
            return; // No theme to load
        }
        
        // Check if theme data is available
        if (window.__mikaForgeThemeData && window.__mikaForgeThemeFiles) {
            // Theme data is available, apply it
            applyTheme(savedTheme);
        } else {
            // Theme data not available yet, wait and retry
            let attempts = 0;
            const maxAttempts = 50; // Wait up to 5 seconds
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.__mikaForgeThemeData && window.__mikaForgeThemeFiles) {
                    clearInterval(checkInterval);
                    applyTheme(savedTheme);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('[MikaForge] Theme data not available after waiting');
                }
            }, 100);
        }
    }
    
    function addMikaThemesButton() {
        // Find the settings menu
        const generalMenu = document.querySelector('.general-menu');
        if (!generalMenu) {
            // Menu not found yet, try again later
            setTimeout(addMikaThemesButton, 100);
            return;
        }
        
        // Check if button already exists
        if (document.querySelector('.mika-themes-menu-item')) {
            return;
        }
        
        // Create the menu item
        const menuItem = document.createElement('li');
        menuItem.className = 'settings-list-item mika-themes-menu-item';
        
        const menuLink = document.createElement('a');
        menuLink.className = 'settings-menu-item';
        menuLink.href = '#/settings/mika-themes';
        menuLink.setAttribute('data-discover', 'true');
        menuLink.setAttribute('draggable', 'false');
        menuLink.style.userSelect = 'none';
        menuLink.style.webkitUserDrag = 'none';
        
        // Create SVG icon - color palette icon for themes
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.cssText = 'fill: currentColor;';
        
        // Color palette icon
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z');
        path.setAttribute('fill', 'currentColor');
        
        svg.appendChild(path);
        
        menuLink.appendChild(svg);
        menuLink.appendChild(document.createTextNode('Mika Themes'));
        
        menuItem.appendChild(menuLink);
        
        // Prevent drag events
        menuLink.addEventListener('dragstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        menuLink.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Handle clicks
        menuLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!window.location.hash.includes('#/settings')) {
                const settingsLink = document.querySelector('a[href="#/settings/general"]');
                if (settingsLink) {
                    settingsLink.click();
                    setTimeout(() => {
                        showThemesList();
                        setTimeout(() => {
                            window.history.replaceState(null, null, '#/settings/mika-themes');
                        }, 50);
                    }, 300);
                } else {
                    showThemesList();
                }
            } else {
                showThemesList();
                window.history.replaceState(null, null, '#/settings/mika-themes');
            }
        });
        
        // Watch for clicks on any settings menu items
        function setupMenuWatcher() {
            document.addEventListener('click', (e) => {
                const clickedLink = e.target.closest('.settings-menu-item');
                if (clickedLink) {
                    if (clickedLink === menuLink) {
                        showThemesList();
                    } else {
                        hideThemesPanel();
                    }
                }
            }, true);
        }
        
        // Watch for panel changes
        function watchPanelChanges() {
            const settingsContainer = document.querySelector('.settings-main-container');
            if (!settingsContainer) {
                setTimeout(watchPanelChanges, 100);
                return;
            }
            
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        if (target.classList.contains('is-active') && 
                            target.id !== 'mika-themes-settings-panel' &&
                            target.classList.contains('panel')) {
                            hideThemesPanel();
                        }
                    }
                });
            });
            
            settingsContainer.querySelectorAll('.panel').forEach(panel => {
                observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
            });
            
            const containerObserver = new MutationObserver(() => {
                settingsContainer.querySelectorAll('.panel').forEach(panel => {
                    if (!panel.dataset.observed) {
                        panel.dataset.observed = 'true';
                        observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
                    }
                });
            });
            
            containerObserver.observe(settingsContainer, { childList: true, subtree: true });
        }
        
        function hideThemesPanel() {
            const panel = document.getElementById('mika-themes-settings-panel');
            if (panel) {
                panel.classList.remove('is-active');
            }
            menuLink.classList.remove('is-active');
        }
        
        // Watch for hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (!hash.includes('mika-themes') && !hash.includes('settings')) {
                hideThemesPanel();
            } else if (hash.includes('settings') && !hash.includes('mika-themes')) {
                hideThemesPanel();
            }
        });
        
        setupMenuWatcher();
        watchPanelChanges();
        
        function showThemesList() {
            const settingsContainer = document.querySelector('.settings-main-container');
            if (!settingsContainer) {
                return;
            }
            
            let existingPanel = document.getElementById('mika-themes-settings-panel');
            if (existingPanel) {
                existingPanel.classList.add('is-active');
                settingsContainer.querySelectorAll('.panel').forEach(panel => {
                    if (panel.id !== 'mika-themes-settings-panel') {
                        panel.classList.remove('is-active');
                    }
                });
                const generalMenu = document.querySelector('.general-menu');
                if (generalMenu) {
                    generalMenu.querySelectorAll('.settings-menu-item').forEach(item => {
                        item.classList.remove('is-active');
                    });
                }
                menuLink.classList.add('is-active');
                // Remove and recreate the panel to refresh the list
                existingPanel.remove();
            }
            
            const themes = getAvailableThemes();
            const currentTheme = getCurrentTheme();
            
            settingsContainer.querySelectorAll('.panel').forEach(panel => {
                if (panel.id !== 'mika-themes-settings-panel') {
                    panel.classList.remove('is-active');
                }
            });
            
            const panel = document.createElement('section');
            panel.id = 'mika-themes-settings-panel';
            panel.className = 'panel is-active';
            
            const title = document.createElement('h1');
            title.className = 'settings-section-title';
            title.textContent = 'Mika Themes';
            panel.appendChild(title);
            
            const descriptionRow = document.createElement('div');
            descriptionRow.className = 'settings-item-row';
            const descriptionP = document.createElement('p');
            descriptionP.style.cssText = 'color: #d4d4d4; margin-bottom: 20px;';
            descriptionP.textContent = 'Switch between custom themes to personalize your CurseForge experience.';
            descriptionRow.appendChild(descriptionP);
            panel.appendChild(descriptionRow);
            
            // Live CSS Editor Toggle
            const editorToggleRow = document.createElement('div');
            editorToggleRow.className = 'settings-item-row';
            editorToggleRow.style.cssText = 'margin-bottom: 20px; padding: 12px; background: #252526; border-radius: 4px; border: 1px solid #3e3e42;';
            
            const editorToggleLabel = document.createElement('label');
            editorToggleLabel.style.cssText = 'display: flex; align-items: center; justify-content: space-between; cursor: pointer;';
            
            const editorToggleText = document.createElement('div');
            editorToggleText.style.cssText = 'flex: 1;';
            
            const editorToggleTitle = document.createElement('div');
            editorToggleTitle.style.cssText = 'color: #fff; font-weight: 600; font-size: 14px; margin-bottom: 4px;';
            editorToggleTitle.textContent = 'Live CSS Editor';
            editorToggleText.appendChild(editorToggleTitle);
            
            const editorToggleDesc = document.createElement('div');
            editorToggleDesc.style.cssText = 'color: #888; font-size: 12px;';
            editorToggleDesc.textContent = 'Open a floating CSS editor to test styles in real-time';
            editorToggleText.appendChild(editorToggleDesc);
            
            const editorToggleSwitch = document.createElement('div');
            editorToggleSwitch.className = 'mika-css-editor-toggle';
            const isEditorVisible = localStorage.getItem(LIVE_CSS_EDITOR_VISIBLE_KEY) === 'true';
            editorToggleSwitch.style.cssText = `
                width: 44px;
                height: 24px;
                background: ${isEditorVisible ? '#007acc' : '#3e3e42'};
                border-radius: 12px;
                position: relative;
                cursor: pointer;
                transition: background 0.2s;
                flex-shrink: 0;
            `;
            
            const editorToggleKnob = document.createElement('div');
            editorToggleKnob.style.cssText = `
                width: 18px;
                height: 18px;
                background: #fff;
                border-radius: 50%;
                position: absolute;
                top: 3px;
                left: ${isEditorVisible ? '23px' : '3px'};
                transition: left 0.2s;
            `;
            editorToggleSwitch.appendChild(editorToggleKnob);
            
            editorToggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleLiveCssEditor();
            });
            
            editorToggleLabel.appendChild(editorToggleText);
            editorToggleLabel.appendChild(editorToggleSwitch);
            editorToggleRow.appendChild(editorToggleLabel);
            panel.appendChild(editorToggleRow);
            
            const themesContainer = document.createElement('div');
            themesContainer.className = 'themes-list-container';
            themesContainer.style.cssText = 'margin-top: 20px;';
            
            if (themes.length > 0) {
                themes.forEach(theme => {
                    const themeItem = document.createElement('div');
                    themeItem.className = 'theme-item';
                    themeItem.style.cssText = `
                        padding: 16px;
                        margin-bottom: 12px;
                        background: #2d2d2d;
                        border-radius: 4px;
                        border: 1px solid #3e3e42;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        cursor: pointer;
                        transition: background 0.2s, border-color 0.2s;
                    `;
                    
                    themeItem.addEventListener('mouseenter', () => {
                        if (theme.file !== currentTheme) {
                            themeItem.style.background = '#353535';
                            themeItem.style.borderColor = '#4e4e52';
                        }
                    });
                    
                    themeItem.addEventListener('mouseleave', () => {
                        if (theme.file !== currentTheme) {
                            themeItem.style.background = '#2d2d2d';
                            themeItem.style.borderColor = '#3e3e42';
                        }
                    });
                    
                    if (theme.file === currentTheme) {
                        themeItem.style.background = '#1e3a5f';
                        themeItem.style.borderColor = '#007acc';
                    }
                    
                    const themeInfo = document.createElement('div');
                    themeInfo.style.cssText = 'flex: 1;';
                    
                    const themeName = document.createElement('div');
                    themeName.style.cssText = `
                        font-weight: 600;
                        color: #fff;
                        font-size: 14px;
                        margin-bottom: 4px;
                    `;
                    themeName.textContent = theme.name;
                    themeInfo.appendChild(themeName);
                    
                    const themePath = document.createElement('div');
                    themePath.style.cssText = `
                        color: #888;
                        font-size: 12px;
                    `;
                    themePath.textContent = theme.path;
                    themeInfo.appendChild(themePath);
                    
                    const activeBadge = document.createElement('div');
                    if (theme.file === currentTheme) {
                        activeBadge.style.cssText = `
                            padding: 4px 12px;
                            background: #007acc;
                            color: #fff;
                            border-radius: 3px;
                            font-size: 11px;
                            font-weight: 600;
                        `;
                        activeBadge.textContent = 'Active';
                    } else {
                        activeBadge.style.cssText = `
                            padding: 4px 12px;
                            background: #3e3e42;
                            color: #ccc;
                            border-radius: 3px;
                            font-size: 11px;
                            font-weight: 600;
                            cursor: pointer;
                        `;
                        activeBadge.textContent = 'Apply';
                    }
                    
                    themeItem.addEventListener('click', () => {
                        const currentTheme = getCurrentTheme();
                        if (theme.file === currentTheme) {
                            // Theme is already active, deactivate it
                            removeTheme();
                        } else {
                            // Apply the new theme
                            applyTheme(theme.file);
                        }
                        showThemesList(); // Refresh to update active state
                    });
                    
                    themeItem.appendChild(themeInfo);
                    themeItem.appendChild(activeBadge);
                    themesContainer.appendChild(themeItem);
                });
            } else {
                const noThemes = document.createElement('div');
                noThemes.style.cssText = 'color: #888; padding: 20px; text-align: center;';
                noThemes.textContent = 'No themes found';
                themesContainer.appendChild(noThemes);
            }
            
            panel.appendChild(themesContainer);
            
            const footerRow = document.createElement('div');
            footerRow.className = 'settings-item-row';
            footerRow.style.cssText = 'margin-top: 30px; padding-top: 20px; border-top: 1px solid #3e3e42;';
            const footerP = document.createElement('p');
            footerP.style.cssText = 'color: #888; font-size: 12px;';
            const code = document.createElement('code');
            code.style.cssText = 'background: #1e1e1e; padding: 2px 6px; border-radius: 2px;';
            code.textContent = '%appdata%/MikaForge/themes';
            footerP.appendChild(document.createTextNode('Themes are loaded from: '));
            footerP.appendChild(code);
            footerRow.appendChild(footerP);
            panel.appendChild(footerRow);
            
            settingsContainer.appendChild(panel);
            
            const generalMenu = document.querySelector('.general-menu');
            if (generalMenu) {
                generalMenu.querySelectorAll('.settings-menu-item').forEach(item => {
                    item.classList.remove('is-active');
                });
            }
            menuLink.classList.add('is-active');
        }
        
        function getAvailableThemes() {
            const themes = [];
            const themeFiles = window.__mikaForgeThemeFiles || [];
            
            themeFiles.forEach(file => {
                const themeName = file.replace(/\.css$/, '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                themes.push({
                    name: themeName,
                    path: `themes/${file}`,
                    file: file
                });
            });
            
            return themes;
        }
        
        // Use global functions (defined above)
        
        // Load saved live CSS on page load
        const savedLiveCss = localStorage.getItem(LIVE_CSS_STORAGE_KEY);
        if (savedLiveCss) {
            setTimeout(() => {
                applyLiveCss(savedLiveCss);
            }, 100);
        }
        
        // Show editor if it was visible before
        const wasEditorVisible = localStorage.getItem(LIVE_CSS_EDITOR_VISIBLE_KEY) === 'true';
        if (wasEditorVisible) {
            setTimeout(() => {
                createLiveCssEditor();
            }, 200);
        }
        
        // Insert after the last item in general-menu
        generalMenu.appendChild(menuItem);
    }
    
    // Live CSS Editor Functions
    function toggleLiveCssEditor() {
        if (liveCssEditor && liveCssEditor.parentElement) {
            hideLiveCssEditor();
        } else {
            createLiveCssEditor();
        }
    }
    
    function createLiveCssEditor() {
        // Remove existing editor if any
        if (liveCssEditor && liveCssEditor.parentElement) {
            liveCssEditor.remove();
        }
        
        // Create floating editor container
        liveCssEditor = document.createElement('div');
        liveCssEditor.id = '__mikaForge_liveCssEditor';
        
        // Load saved size
        const savedSize = localStorage.getItem('__mikaForge_liveCssEditor_size');
        const defaultSize = { width: 500, height: 600 };
        const editorSize = savedSize ? JSON.parse(savedSize) : defaultSize;
        
        liveCssEditor.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: ${editorSize.width}px;
            height: ${editorSize.height}px;
            background: #252526;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        // Make it draggable
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        const header = document.createElement('div');
        header.style.cssText = `
            background: #1e1e1e;
            padding: 12px 16px;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: move;
            user-select: none;
        `;
        
        const headerTitle = document.createElement('div');
        headerTitle.style.cssText = 'color: #fff; font-weight: 600; font-size: 14px;';
        headerTitle.textContent = 'Live CSS Editor';
        header.appendChild(headerTitle);
        
        const headerButtons = document.createElement('div');
        headerButtons.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        
        let isMinimized = false;
        const minimizeBtn = document.createElement('button');
        minimizeBtn.textContent = '−';
        minimizeBtn.style.cssText = `
            width: 24px;
            height: 24px;
            background: transparent;
            border: 1px solid #3e3e42;
            color: #ccc;
            border-radius: 3px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            padding: 0;
        `;
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMinimized) {
                // Restore
                const savedSize = localStorage.getItem('__mikaForge_liveCssEditor_size');
                const defaultSize = { width: 500, height: 600 };
                const editorSize = savedSize ? JSON.parse(savedSize) : defaultSize;
                liveCssEditor.style.height = editorSize.height + 'px';
                liveCssEditor.style.overflow = 'visible';
                const editorContent = liveCssEditor.querySelector('#__mikaForge_liveCssEditor_content');
                if (editorContent) editorContent.style.display = 'flex';
                minimizeBtn.textContent = '−';
                isMinimized = false;
            } else {
                // Minimize
                liveCssEditor.style.height = '40px';
                liveCssEditor.style.overflow = 'hidden';
                const editorContent = liveCssEditor.querySelector('#__mikaForge_liveCssEditor_content');
                if (editorContent) editorContent.style.display = 'none';
                minimizeBtn.textContent = '+';
                isMinimized = true;
            }
        });
        
        // Double-click header to restore if minimized
        header.addEventListener('dblclick', () => {
            if (isMinimized) {
                const savedSize = localStorage.getItem('__mikaForge_liveCssEditor_size');
                const defaultSize = { width: 500, height: 600 };
                const editorSize = savedSize ? JSON.parse(savedSize) : defaultSize;
                liveCssEditor.style.height = editorSize.height + 'px';
                liveCssEditor.style.overflow = 'visible';
                const editorContent = liveCssEditor.querySelector('#__mikaForge_liveCssEditor_content');
                if (editorContent) editorContent.style.display = 'flex';
                minimizeBtn.textContent = '−';
                isMinimized = false;
            }
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            width: 24px;
            height: 24px;
            background: transparent;
            border: 1px solid #3e3e42;
            color: #ccc;
            border-radius: 3px;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            padding: 0;
        `;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideLiveCssEditor();
        });
        
        headerButtons.appendChild(minimizeBtn);
        headerButtons.appendChild(closeBtn);
        header.appendChild(headerButtons);
        
        // Drag functionality
        header.addEventListener('mousedown', (e) => {
            if (e.target === minimizeBtn || e.target === closeBtn) return;
            isDragging = true;
            const rect = liveCssEditor.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            header.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            
            // Keep within viewport
            const maxX = window.innerWidth - liveCssEditor.offsetWidth;
            const maxY = window.innerHeight - liveCssEditor.offsetHeight;
            
            liveCssEditor.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            liveCssEditor.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
            liveCssEditor.style.right = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'move';
            }
        });
        
        // Editor content
        const editorContent = document.createElement('div');
        editorContent.id = '__mikaForge_liveCssEditor_content';
        editorContent.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #1e1e1e;
        `;
        
        // Create editor wrapper for VS Code-like styling with syntax highlighting
        const editorWrapper = document.createElement('div');
        editorWrapper.style.cssText = `
            flex: 1;
            position: relative;
            background: #1e1e1e;
            overflow: hidden;
        `;
        
        // Syntax highlight overlay (behind textarea)
        const highlightOverlay = document.createElement('pre');
        highlightOverlay.id = '__mikaForge_liveCssEditor_highlight';
        highlightOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: 0;
            padding: 16px;
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 14px;
            font-weight: normal;
            line-height: 19px;
            letter-spacing: 0;
            overflow: hidden;
            pointer-events: none;
            z-index: 1;
            white-space: pre;
            word-wrap: normal;
            tab-size: 4;
            -moz-tab-size: 4;
            box-sizing: border-box;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        `;
        
        // Textarea (transparent, on top for input)
        const editorTextarea = document.createElement('textarea');
        editorTextarea.id = '__mikaForge_liveCssEditor_textarea';
        editorTextarea.spellcheck = false;
        editorTextarea.autocomplete = 'off';
        editorTextarea.autocorrect = 'off';
        editorTextarea.autocapitalize = 'off';
        editorTextarea.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            color: transparent;
            border: none;
            padding: 16px;
            margin: 0;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 14px;
            font-weight: normal;
            line-height: 19px;
            letter-spacing: 0;
            resize: none;
            outline: none;
            overflow-y: auto;
            overflow-x: auto;
            white-space: pre;
            word-wrap: normal;
            tab-size: 4;
            -moz-tab-size: 4;
            box-sizing: border-box;
            caret-color: #aeafad;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            z-index: 2;
        `;
        
        // VS Code-like scrollbar styling
        const style = document.createElement('style');
        style.textContent = `
            #__mikaForge_liveCssEditor_textarea::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            #__mikaForge_liveCssEditor_textarea::-webkit-scrollbar-track {
                background: #1e1e1e;
            }
            #__mikaForge_liveCssEditor_textarea::-webkit-scrollbar-thumb {
                background: #424242;
                border-radius: 5px;
            }
            #__mikaForge_liveCssEditor_textarea::-webkit-scrollbar-thumb:hover {
                background: #4e4e4e;
            }
            #__mikaForge_liveCssEditor_textarea::selection {
                background: #264f78;
                color: #ffffff;
            }
            #__mikaForge_liveCssEditor_textarea::-moz-selection {
                background: #264f78;
                color: #ffffff;
            }
        `;
        document.head.appendChild(style);
        
        editorWrapper.appendChild(highlightOverlay);
        editorWrapper.appendChild(editorTextarea);
        
        // Load saved CSS
        const savedCss = localStorage.getItem(LIVE_CSS_STORAGE_KEY) || '';
        editorTextarea.value = savedCss;
        
        // CSS Syntax Highlighter (VS Code Dark+ theme colors)
        function highlightCss(css) {
            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };
            
            // VS Code Dark+ theme colors
            const colors = {
                comment: '#6a9955',        // Green for comments
                selector: '#d7ba7d',       // Yellow for selectors
                property: '#9cdcfe',       // Light blue for properties
                value: '#ce9178',          // Orange for values
                string: '#ce9178',        // Orange for strings
                punctuation: '#d4d4d4',   // White for punctuation
                keyword: '#569cd6',        // Blue for keywords (@media, @keyframes, etc.)
                number: '#b5cea8',         // Light green for numbers
                function: '#dcdcaa',       // Yellow for functions (calc, rgb, etc.)
                atRule: '#c586c0',         // Purple for @ rules
                default: '#d4d4d4'        // Default text color
            };
            
            let result = '';
            let i = 0;
            const len = css.length;
            let inComment = false;
            let inString = false;
            let stringChar = '';
            let state = 'selector'; // selector, property, value, atRule
            let currentToken = '';
            let tokenType = 'default';
            
            const flushToken = () => {
                if (currentToken) {
                    const color = colors[tokenType] || colors.default;
                    result += `<span style="color: ${color}">${escapeHtml(currentToken)}</span>`;
                    currentToken = '';
                }
            };
            
            const addChar = (char, type) => {
                if (tokenType !== type) {
                    flushToken();
                    tokenType = type;
                }
                currentToken += char;
            };
            
            while (i < len) {
                const char = css[i];
                const nextChar = i + 1 < len ? css[i + 1] : '';
                const prevChar = i > 0 ? css[i - 1] : '';
                
                // Handle comments
                if (!inString && char === '/' && nextChar === '*') {
                    flushToken();
                    inComment = true;
                    result += `<span style="color: ${colors.comment}">/*`;
                    i += 2;
                    while (i < len) {
                        if (css[i] === '*' && i + 1 < len && css[i + 1] === '/') {
                            result += '*/</span>';
                            i += 2;
                            inComment = false;
                            break;
                        }
                        result += escapeHtml(css[i]);
                        i++;
                    }
                    continue;
                }
                
                if (inComment) {
                    result += escapeHtml(char);
                    i++;
                    continue;
                }
                
                // Handle strings
                if (!inString && (char === '"' || char === "'")) {
                    flushToken();
                    inString = true;
                    stringChar = char;
                    addChar(char, 'string');
                    i++;
                    continue;
                }
                
                if (inString) {
                    if (char === '\\') {
                        addChar(char + (nextChar || ''), 'string');
                        i += 2;
                        continue;
                    }
                    if (char === stringChar) {
                        addChar(char, 'string');
                        flushToken();
                        inString = false;
                        stringChar = '';
                        i++;
                        continue;
                    }
                    addChar(char, 'string');
                    i++;
                    continue;
                }
                
                // Handle @ rules (@media, @keyframes, etc.)
                if (char === '@' && state === 'selector') {
                    flushToken();
                    addChar(char, 'atRule');
                    i++;
                    // Continue reading the at-rule name
                    while (i < len && /[a-zA-Z-]/.test(css[i])) {
                        addChar(css[i], 'atRule');
                        i++;
                    }
                    flushToken();
                    continue;
                }
                
                // State transitions
                if (char === '{') {
                    flushToken();
                    result += `<span style="color: ${colors.punctuation}">{</span>`;
                    state = 'property';
                    i++;
                    continue;
                }
                
                if (char === '}') {
                    flushToken();
                    result += `<span style="color: ${colors.punctuation}">}</span>`;
                    state = 'selector';
                    i++;
                    continue;
                }
                
                if (char === ':') {
                    flushToken();
                    result += `<span style="color: ${colors.punctuation}">:</span>`;
                    state = 'value';
                    i++;
                    continue;
                }
                
                if (char === ';') {
                    flushToken();
                    result += `<span style="color: ${colors.punctuation}">;</span>`;
                    state = 'property';
                    i++;
                    continue;
                }
                
                // Functions in values (calc, rgb, rgba, etc.)
                if (state === 'value' && /[a-zA-Z]/.test(char)) {
                    const funcMatch = css.substr(i).match(/^([a-zA-Z0-9_-]+)\s*\(/);
                    if (funcMatch) {
                        flushToken();
                        result += `<span style="color: ${colors.function}">${escapeHtml(funcMatch[1])}</span>`;
                        result += `<span style="color: ${colors.punctuation}">(</span>`;
                        i += funcMatch[1].length + 1;
                        continue;
                    }
                }
                
                // Numbers in values
                if (state === 'value' && /[0-9]/.test(char)) {
                    const numMatch = css.substr(i).match(/^([0-9]+\.?[0-9]*(?:px|em|rem|%|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax|deg|rad|grad|ms|s|Hz|kHz)?)/);
                    if (numMatch) {
                        flushToken();
                        result += `<span style="color: ${colors.number}">${escapeHtml(numMatch[1])}</span>`;
                        i += numMatch[1].length;
                        continue;
                    }
                }
                
                // CSS keywords in values (important, inherit, etc.)
                if (state === 'value' && /[a-zA-Z]/.test(char)) {
                    const keywordMatch = css.substr(i).match(/^(important|inherit|initial|unset|revert|auto|none|transparent)\b/);
                    if (keywordMatch) {
                        flushToken();
                        result += `<span style="color: ${colors.keyword}">${escapeHtml(keywordMatch[1])}</span>`;
                        i += keywordMatch[1].length;
                        continue;
                    }
                }
                
                // Add character based on state
                if (state === 'selector') {
                    addChar(char, 'selector');
                } else if (state === 'property') {
                    addChar(char, 'property');
                } else if (state === 'value') {
                    addChar(char, 'value');
            } else {
                    addChar(char, 'default');
                }
                
                i++;
            }
            
            flushToken();
            return result;
        }
        
        // Update syntax highlighting
        function updateSyntaxHighlight(css) {
            highlightOverlay.innerHTML = highlightCss(css);
        }
        
        // Initial highlight
        updateSyntaxHighlight(savedCss);
        
        // Sync scroll between textarea and highlight overlay
        editorTextarea.addEventListener('scroll', () => {
            highlightOverlay.scrollTop = editorTextarea.scrollTop;
            highlightOverlay.scrollLeft = editorTextarea.scrollLeft;
        });
        
        // Handle tab key for proper indentation (VS Code style)
        editorTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editorTextarea.selectionStart;
                const end = editorTextarea.selectionEnd;
                const value = editorTextarea.value;
                
                if (e.shiftKey) {
                    // Remove indentation
                    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                    const indentSize = 4;
                    if (start - lineStart >= indentSize && value.substring(lineStart, lineStart + indentSize) === '    ') {
                        editorTextarea.value = value.substring(0, lineStart) + value.substring(lineStart + indentSize);
                        editorTextarea.selectionStart = editorTextarea.selectionEnd = start - indentSize;
                        updateSyntaxHighlight(editorTextarea.value);
                    }
                } else {
                    // Insert 4 spaces (VS Code default tab size)
                    editorTextarea.value = value.substring(0, start) + '    ' + value.substring(end);
                    editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 4;
                    updateSyntaxHighlight(editorTextarea.value);
                }
            }
        });
        
        // Apply CSS on input and update highlighting
        let cssUpdateTimeout = null;
        editorTextarea.addEventListener('input', () => {
            const css = editorTextarea.value;
            updateSyntaxHighlight(css);
            
            clearTimeout(cssUpdateTimeout);
            cssUpdateTimeout = setTimeout(() => {
                applyLiveCss(css);
                localStorage.setItem(LIVE_CSS_STORAGE_KEY, css);
            }, 100); // Debounce for performance
        });
        
        // Info text
        const infoText = document.createElement('div');
        infoText.style.cssText = `
            padding: 8px 12px;
            background: #1e1e1e;
            border-top: 1px solid #3e3e42;
            color: #858585;
            font-size: 11px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        infoText.textContent = 'CSS is applied in real-time. Changes are saved automatically.';
        
        editorContent.appendChild(editorWrapper);
        editorContent.appendChild(infoText);
        
        // Resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            cursor: nwse-resize;
            z-index: 10;
            background: transparent;
        `;
        
        // Resize indicator (visual handle)
        const resizeIndicator = document.createElement('div');
        resizeIndicator.style.cssText = `
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 0 0 12px 12px;
            border-color: transparent transparent #3e3e42 transparent;
            pointer-events: none;
        `;
        resizeHandle.appendChild(resizeIndicator);
        
        let isResizing = false;
        let resizeStartX = 0;
        let resizeStartY = 0;
        let resizeStartWidth = 0;
        let resizeStartHeight = 0;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            resizeStartWidth = liveCssEditor.offsetWidth;
            resizeStartHeight = liveCssEditor.offsetHeight;
            document.body.style.cursor = 'nwse-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - resizeStartX;
            const deltaY = e.clientY - resizeStartY;
            
            const newWidth = Math.max(300, Math.min(1200, resizeStartWidth + deltaX));
            const newHeight = Math.max(200, Math.min(800, resizeStartHeight + deltaY));
            
            liveCssEditor.style.width = newWidth + 'px';
            liveCssEditor.style.height = newHeight + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                // Save size
                const size = {
                    width: liveCssEditor.offsetWidth,
                    height: liveCssEditor.offsetHeight
                };
                localStorage.setItem('__mikaForge_liveCssEditor_size', JSON.stringify(size));
            }
        });
        
        liveCssEditor.appendChild(header);
        liveCssEditor.appendChild(editorContent);
        liveCssEditor.appendChild(resizeHandle);
        document.body.appendChild(liveCssEditor);
        
        // Apply any existing CSS
        if (savedCss) {
            applyLiveCss(savedCss);
        }
        
        // Update toggle state
        const toggle = document.querySelector('.mika-css-editor-toggle');
        if (toggle) {
            toggle.style.background = '#007acc';
            const knob = toggle.querySelector('div');
            if (knob) knob.style.left = '23px';
        }
        localStorage.setItem(LIVE_CSS_EDITOR_VISIBLE_KEY, 'true');
    }
    
    function hideLiveCssEditor() {
        if (liveCssEditor && liveCssEditor.parentElement) {
            liveCssEditor.remove();
        }
        
        // Update toggle state
        const toggle = document.querySelector('.mika-css-editor-toggle');
        if (toggle) {
            toggle.style.background = '#3e3e42';
            const knob = toggle.querySelector('div');
            if (knob) knob.style.left = '3px';
        }
        localStorage.setItem(LIVE_CSS_EDITOR_VISIBLE_KEY, 'false');
    }
    
    function applyLiveCss(css) {
        // Remove existing live CSS style
        if (liveCssStyle && liveCssStyle.parentElement) {
            liveCssStyle.remove();
        }
        
        if (css && css.trim()) {
            // Create and apply new style
            liveCssStyle = document.createElement('style');
            liveCssStyle.id = '__mikaForge_liveCss_style';
            liveCssStyle.textContent = css;
            document.head.appendChild(liveCssStyle);
        } else {
            liveCssStyle = null;
        }
    }
    
    // Load theme immediately (don't wait for settings menu)
    loadThemeOnPageLoad();
    
    // Check periodically for theme data (in case it loads after this script)
    let themeCheckInterval = setInterval(() => {
        if (window.__mikaForgeThemeData && window.__mikaForgeThemeFiles) {
            loadThemeOnPageLoad();
            clearInterval(themeCheckInterval);
        }
    }, 100);
    
    // Clear interval after 5 seconds
    setTimeout(() => {
        clearInterval(themeCheckInterval);
    }, 5000);
    
    // Also listen for theme refresh events (when themes are loaded/refreshed)
    window.addEventListener('__mikaForgeThemesRefreshed', () => {
        loadThemeOnPageLoad();
    });
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addMikaThemesButton);
    } else {
        addMikaThemesButton();
    }
    
    // Watch for navigation changes
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(addMikaThemesButton, 100);
            
            // Re-apply theme after navigation
            setTimeout(() => {
                loadThemeOnPageLoad();
            }, 200);
            
            // Restore editor if it was visible
            const wasEditorVisible = localStorage.getItem(LIVE_CSS_EDITOR_VISIBLE_KEY) === 'true';
            if (wasEditorVisible && (!liveCssEditor || !liveCssEditor.parentElement)) {
                setTimeout(() => {
                    createLiveCssEditor();
                }, 300);
            }
            
            // Re-apply live CSS after navigation
            const savedLiveCss = localStorage.getItem(LIVE_CSS_STORAGE_KEY);
            if (savedLiveCss) {
                setTimeout(() => {
                    applyLiveCss(savedLiveCss);
                }, 200);
            }
        }
    }).observe(document, { subtree: true, childList: true });
    
    // Also watch for hash changes to restore editor
    window.addEventListener('hashchange', () => {
        // Re-apply theme after hash change
        setTimeout(() => {
            loadThemeOnPageLoad();
        }, 200);
        
        const wasEditorVisible = localStorage.getItem(LIVE_CSS_EDITOR_VISIBLE_KEY) === 'true';
        if (wasEditorVisible && (!liveCssEditor || !liveCssEditor.parentElement)) {
            setTimeout(() => {
                createLiveCssEditor();
            }, 300);
        }
        
        // Re-apply live CSS after hash change
        const savedLiveCss = localStorage.getItem(LIVE_CSS_STORAGE_KEY);
        if (savedLiveCss) {
            setTimeout(() => {
                applyLiveCss(savedLiveCss);
            }, 200);
        }
    });
})();