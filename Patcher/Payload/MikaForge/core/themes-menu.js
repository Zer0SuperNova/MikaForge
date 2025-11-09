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
        
        // Load saved theme on page load
        const savedTheme = getCurrentTheme();
        if (savedTheme) {
            setTimeout(() => {
                applyTheme(savedTheme);
            }, 100);
        }
        
        // Insert after the last item in general-menu
        generalMenu.appendChild(menuItem);
    }
    
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
        }
    }).observe(document, { subtree: true, childList: true });
})();

