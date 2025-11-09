(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.__mikaForgePluginsMenu) {
        return;
    }
    window.__mikaForgePluginsMenu = true;
    
    function addMikaPluginsButton() {
        // Find the settings menu
        const generalMenu = document.querySelector('.general-menu');
        if (!generalMenu) {
            // Menu not found yet, try again later
            setTimeout(addMikaPluginsButton, 100);
            return;
        }
        
        // Check if button already exists
        if (document.querySelector('.mika-plugins-menu-item')) {
            return;
        }
        
        // Create the menu item
        const menuItem = document.createElement('li');
        menuItem.className = 'settings-list-item mika-plugins-menu-item';
        
        const menuLink = document.createElement('a');
        menuLink.className = 'settings-menu-item';
        menuLink.href = '#/settings/mika-plugins';
        menuLink.setAttribute('data-discover', 'true');
        // Prevent drag behavior to avoid showing file location
        menuLink.setAttribute('draggable', 'false');
        menuLink.style.userSelect = 'none';
        menuLink.style.webkitUserDrag = 'none';
        
        // Create SVG icon - custom puzzle piece icon for plugins
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.cssText = 'fill: currentColor;';
        
        // Create a clean puzzle piece icon representing plugins/modules
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // Puzzle piece icon - represents modular/plugin functionality
        path.setAttribute('d', 'M20.5,11H19V7C19,5.89 18.1,5 17,5H13V3.5A2.5,2.5 0 0,0 10.5,1A2.5,2.5 0 0,0 8,3.5V5H4A2,2 0 0,0 2,7V10.8H3.5C4.88,10.8 6,11.92 6,13.3C6,14.68 4.88,15.8 3.5,15.8H2V19A2,2 0 0,0 4,21H7.8V19.5C7.8,18.12 8.92,17 10.3,17C11.68,17 12.8,18.12 12.8,19.5V21H16A2,2 0 0,0 18,19V15H20.5A2.5,2.5 0 0,0 23,12.5A2.5,2.5 0 0,0 20.5,11Z');
        path.setAttribute('fill', 'currentColor');
        
        svg.appendChild(path);
        
        menuLink.appendChild(svg);
        menuLink.appendChild(document.createTextNode('Mika Plugins'));
        
        menuItem.appendChild(menuLink);
        
        // Insert after the last item in general-menu
        generalMenu.appendChild(menuItem);
        
        // Prevent drag events to avoid showing file location
        menuLink.addEventListener('dragstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        menuLink.addEventListener('selectstart', (e) => {
            // Prevent text selection when dragging
            e.preventDefault();
            return false;
        });
        
        // Handle clicks - intercept and show our content manually
        menuLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // First, ensure we're on the settings page
            if (!window.location.hash.includes('#/settings')) {
                // Navigate to settings first
                const settingsLink = document.querySelector('a[href="#/settings/general"]');
                if (settingsLink) {
                    settingsLink.click();
                    // Wait for settings to load, then show our plugins
                    setTimeout(() => {
                        showPluginsList();
                        // Update hash without triggering navigation
                        const currentHash = window.location.hash;
                        if (!currentHash.includes('mika-plugins')) {
                            window.history.replaceState(null, null, '#/settings/general');
                            // Small delay then update to our hash
                            setTimeout(() => {
                                window.history.replaceState(null, null, '#/settings/mika-plugins');
                            }, 50);
                        }
                    }, 300);
                } else {
                    // Can't find settings link, try to show anyway
                    showPluginsList();
                }
            } else {
                // Already in settings, just show our content
                showPluginsList();
                // Update hash
                window.history.replaceState(null, null, '#/settings/mika-plugins');
            }
        });
        
        // Watch for clicks on any settings menu items to show/hide our panel
        function setupMenuWatcher() {
            // Watch for clicks on any settings menu item in the document
            document.addEventListener('click', (e) => {
                const clickedLink = e.target.closest('.settings-menu-item');
                if (clickedLink) {
                    if (clickedLink === menuLink) {
                        // Mika tab clicked - show it
                        showPluginsList();
                    } else {
                        // Other tab clicked - hide Mika panel
                        hidePluginsPanel();
                    }
                }
            }, true);
        }
        
        // Also watch for when other panels become active
        function watchPanelChanges() {
            const settingsContainer = document.querySelector('.settings-main-container');
            if (!settingsContainer) {
                setTimeout(watchPanelChanges, 100);
                return;
            }
            
            // Use MutationObserver to watch for panel class changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        // If another panel became active and it's not ours
                        if (target.classList.contains('is-active') && 
                            target.id !== 'mika-plugins-settings-panel' &&
                            target.classList.contains('panel')) {
                            hidePluginsPanel();
                        }
                    }
                });
            });
            
            // Observe all panels in the settings container
            settingsContainer.querySelectorAll('.panel').forEach(panel => {
                observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
            });
            
            // Also watch for new panels being added
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
        
        // Hide the plugins panel when navigating away
        function hidePluginsPanel() {
            const panel = document.getElementById('mika-plugins-settings-panel');
            if (panel) {
                panel.classList.remove('is-active');
            }
            // Remove active state from our menu item
            menuLink.classList.remove('is-active');
        }
        
        // Watch for hash changes to detect navigation away
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (!hash.includes('mika-plugins') && !hash.includes('settings')) {
                // Navigating away from settings entirely
                hidePluginsPanel();
            } else if (hash.includes('settings') && !hash.includes('mika-plugins')) {
                // Still in settings but not on our page
                hidePluginsPanel();
            }
        });
        
        // Setup watchers
        setupMenuWatcher();
        watchPanelChanges();
        
        function showPluginsList() {
            // Find the settings container
            const settingsContainer = document.querySelector('.settings-main-container');
            if (!settingsContainer) {
                return;
            }
            
            // Check if we already have our panel to avoid recreating it
            let existingPanel = document.getElementById('mika-plugins-settings-panel');
            if (existingPanel) {
                // Panel already exists, just make sure it's visible
                existingPanel.classList.add('is-active');
                // Hide other panels
                settingsContainer.querySelectorAll('.panel').forEach(panel => {
                    if (panel.id !== 'mika-plugins-settings-panel') {
                        panel.classList.remove('is-active');
                    }
                });
                // Update menu item active states
                const generalMenu = document.querySelector('.general-menu');
                if (generalMenu) {
                    generalMenu.querySelectorAll('.settings-menu-item').forEach(item => {
                        item.classList.remove('is-active');
                    });
                }
                menuLink.classList.add('is-active');
                return;
            }
            
            // Get list of active plugins
            const activePlugins = getActivePlugins();
            
            // Hide existing panels instead of replacing everything
            settingsContainer.querySelectorAll('.panel').forEach(panel => {
                if (panel.id !== 'mika-plugins-settings-panel') {
                    panel.classList.remove('is-active');
                }
            });
            
            // Create the plugins list UI
            const panel = document.createElement('section');
            panel.id = 'mika-plugins-settings-panel';
            panel.className = 'panel is-active';
            
            const title = document.createElement('h1');
            title.className = 'settings-section-title';
            title.textContent = 'Mika Plugins';
            panel.appendChild(title);
            
            const descriptionRow = document.createElement('div');
            descriptionRow.className = 'settings-item-row';
            const descriptionP = document.createElement('p');
            descriptionP.style.cssText = 'color: #d4d4d4; margin-bottom: 20px;';
            descriptionP.textContent = 'Active plugins loaded in this session.';
            descriptionRow.appendChild(descriptionP);
            panel.appendChild(descriptionRow);
            
            const pluginsContainer = document.createElement('div');
            pluginsContainer.className = 'plugins-list-container';
            pluginsContainer.style.cssText = 'margin-top: 20px;';
            
            if (activePlugins.length > 0) {
                activePlugins.forEach(plugin => {
                    const pluginItem = document.createElement('div');
                    pluginItem.className = 'plugin-item';
                    pluginItem.style.cssText = `
                        padding: 16px;
                        margin-bottom: 12px;
                        background: #2d2d2d;
                        border-radius: 4px;
                        border: 1px solid #3e3e42;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    `;
                    
                    const pluginInfo = document.createElement('div');
                    pluginInfo.style.cssText = 'flex: 1;';
                    
                    const pluginName = document.createElement('div');
                    pluginName.style.cssText = `
                        font-weight: 600;
                        color: #fff;
                        font-size: 14px;
                        margin-bottom: 4px;
                    `;
                    pluginName.textContent = plugin.name;
                    pluginInfo.appendChild(pluginName);
                    
                    const pluginPath = document.createElement('div');
                    pluginPath.style.cssText = `
                        color: #888;
                        font-size: 12px;
                    `;
                    pluginPath.textContent = plugin.path;
                    pluginInfo.appendChild(pluginPath);
                    
                    const activeBadge = document.createElement('div');
                    activeBadge.style.cssText = `
                        padding: 4px 12px;
                        background: #007acc;
                        color: #fff;
                        border-radius: 3px;
                        font-size: 11px;
                        font-weight: 600;
                    `;
                    activeBadge.textContent = 'Active';
                    
                    pluginItem.appendChild(pluginInfo);
                    pluginItem.appendChild(activeBadge);
                    pluginsContainer.appendChild(pluginItem);
                });
            } else {
                const noPlugins = document.createElement('div');
                noPlugins.style.cssText = 'color: #888; padding: 20px; text-align: center;';
                noPlugins.textContent = 'No plugins found';
                pluginsContainer.appendChild(noPlugins);
            }
            
            panel.appendChild(pluginsContainer);
            
            const footerRow = document.createElement('div');
            footerRow.className = 'settings-item-row';
            footerRow.style.cssText = 'margin-top: 30px; padding-top: 20px; border-top: 1px solid #3e3e42;';
            const footerP = document.createElement('p');
            footerP.style.cssText = 'color: #888; font-size: 12px;';
            const code = document.createElement('code');
            code.style.cssText = 'background: #1e1e1e; padding: 2px 6px; border-radius: 2px;';
            code.textContent = '%appdata%/MikaForge/plugins';
            footerP.appendChild(document.createTextNode('Plugins are automatically loaded from: '));
            footerP.appendChild(code);
            footerRow.appendChild(footerP);
            panel.appendChild(footerRow);
            
            // Append to container instead of replacing everything
            settingsContainer.appendChild(panel);
            
            // Update the active menu item - remove active from all other items in general-menu
            const generalMenu = document.querySelector('.general-menu');
            if (generalMenu) {
                generalMenu.querySelectorAll('.settings-menu-item').forEach(item => {
                    item.classList.remove('is-active');
                });
            }
            // Add active state to our menu item
            menuLink.classList.add('is-active');
        }
        
        function getActivePlugins() {
            const plugins = [];
            
            // Get list of plugin files from the folder (set by the loader)
            const pluginFiles = window.__mikaForgePluginFiles || [];
            
            pluginFiles.forEach(file => {
                // Use filename as plugin name (without .js extension)
                const pluginName = file.replace(/\.js$/, '');
                plugins.push({
                    name: pluginName,
                    file: file,
                    path: `plugins/${file}`,
                    active: true
                });
            });
            
            return plugins;
        }
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addMikaPluginsButton);
    } else {
        // DOM is already ready
        addMikaPluginsButton();
    }
    
    // Also watch for navigation changes (SPA routing)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(addMikaPluginsButton, 100);
        }
    }).observe(document, { subtree: true, childList: true });
})();

